package org.traccar.handler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.traccar.config.Config;
import org.traccar.config.Keys;
import org.traccar.database.StatisticsManager;
import org.traccar.model.Position;
import org.traccar.session.cache.CacheManager;
import org.traccar.storage.Storage;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class FilterHandlerTest {

    private FilterHandler handler;
    private Config config;
    private CacheManager cacheManager;
    private Storage storage;
    private StatisticsManager statisticsManager;

    @BeforeEach
    public void setUp() {
        config = mock(Config.class);
        cacheManager = mock(CacheManager.class);
        storage = mock(Storage.class);
        statisticsManager = mock(StatisticsManager.class);
    }

    private void createHandler() {
        handler = new FilterHandler(config, cacheManager, storage, statisticsManager);
    }

    @Test
    public void testFilterInvalid() {
        when(config.getBoolean(Keys.FILTER_INVALID)).thenReturn(true);
        createHandler();

        Position position = new Position();
        position.setValid(false);
        position.setLatitude(10.0);
        position.setLongitude(10.0);
        assertTrue(handler.filter(position));

        position.setValid(true);
        position.setLatitude(91.0);
        assertTrue(handler.filter(position));

        position.setLatitude(10.0);
        position.setLongitude(10.0);
        assertFalse(handler.filter(position));
    }

    @Test
    public void testFilterZero() {
        when(config.getBoolean(Keys.FILTER_ZERO)).thenReturn(true);
        createHandler();

        Position position = new Position();
        position.setValid(true);
        position.setLatitude(0.0);
        position.setLongitude(0.0);
        assertTrue(handler.filter(position));

        position.setLatitude(1.0);
        assertFalse(handler.filter(position));
    }

    @Test
    public void testFilterDuplicate() {
        when(config.getBoolean(Keys.FILTER_DUPLICATE)).thenReturn(true);
        createHandler();

        long deviceId = 1;
        Date date = new Date();

        Position last = new Position();
        last.setDeviceId(deviceId);
        last.setFixTime(date);
        last.setLatitude(10.0);
        last.setLongitude(10.0);

        Position current = new Position();
        current.setDeviceId(deviceId);
        current.setFixTime(date);
        current.setLatitude(10.0);
        current.setLongitude(10.0);

        when(cacheManager.getPosition(deviceId)).thenReturn(last);

        assertTrue(handler.filter(current));
    }
}
