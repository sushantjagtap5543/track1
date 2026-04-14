package org.traccar.handler;

import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.traccar.config.Config;
import org.traccar.config.Keys;
import org.traccar.database.StatisticsManager;
import org.traccar.model.Position;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Request;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Singleton
public class BatchDatabaseHandler extends BasePositionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(BatchDatabaseHandler.class);

    private final Storage storage;
    private final StatisticsManager statisticsManager;
    private final int batchSize;
    private final List<BatchItem> buffer = new ArrayList<>();
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    private static class BatchItem {
        private final Position position;
        private final Callback callback;

        BatchItem(Position position, Callback callback) {
            this.position = position;
            this.callback = callback;
        }
    }

    @Inject
    public BatchDatabaseHandler(Config config, Storage storage, StatisticsManager statisticsManager) {
        this.storage = storage;
        this.statisticsManager = statisticsManager;
        this.batchSize = config.getInteger(Keys.DATABASE_MAX_POOL_SIZE, 100); // reuse a sensible default or add a new key
        long flushInterval = 500; // milliseconds

        executor.scheduleWithFixedDelay(this::flush, flushInterval, flushInterval, TimeUnit.MILLISECONDS);
    }

    @Override
    public void onPosition(Position position, Callback callback) {
        synchronized (buffer) {
            buffer.add(new BatchItem(position, callback));
            if (buffer.size() >= batchSize) {
                executor.execute(this::flush);
            }
        }
    }

    private void flush() {
        List<BatchItem> itemsToFlush;
        synchronized (buffer) {
            if (buffer.isEmpty()) {
                return;
            }
            itemsToFlush = new ArrayList<>(buffer);
            buffer.clear();
        }

        try {
            List<Position> positions = itemsToFlush.stream().map(i -> i.position).toList();
            long[] ids = storage.addObjects(positions, new Request(new Columns.Exclude("id")));
            for (int i = 0; i < itemsToFlush.size(); i++) {
                BatchItem item = itemsToFlush.get(i);
                item.position.setId(ids[i]);
                statisticsManager.registerMessageStored(item.position.getDeviceId(), item.position.getProtocol());
                item.callback.processed(false);
            }
        } catch (Exception error) {
            LOGGER.warn("Failed to store positions batch", error);
            for (BatchItem item : itemsToFlush) {
                item.callback.processed(false);
            }
        }
    }

}
