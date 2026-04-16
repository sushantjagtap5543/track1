/*
 * Copyright 2015 - 2025 Anton Tananaev (anton@traccar.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.traccar.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.jetty.websocket.api.Callback;
import org.eclipse.jetty.websocket.api.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.traccar.helper.model.PositionUtil;
import org.traccar.model.Device;
import org.traccar.model.Event;
import org.traccar.model.LogRecord;
import org.traccar.model.Position;
import org.traccar.session.ConnectionManager;
import org.traccar.storage.Storage;
import org.traccar.storage.StorageException;

import java.nio.channels.ClosedChannelException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class AsyncSocket implements Session.Listener.AutoDemanding, ConnectionManager.UpdateListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(AsyncSocket.class);

    private static final String KEY_DEVICES = "devices";
    private static final String KEY_POSITIONS = "positions";
    private static final String KEY_EVENTS = "events";
    private static final String KEY_LOGS = "logs";

    private final Map<String, Collection<Object>> buffer = new HashMap<>();
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    private final ObjectMapper objectMapper;
    private final ConnectionManager connectionManager;
    private final Storage storage;
    private final long userId;

    private boolean includeLogs;
    private Session session;

    public AsyncSocket(ObjectMapper objectMapper, ConnectionManager connectionManager, Storage storage, long userId) {
        this.objectMapper = objectMapper;
        this.connectionManager = connectionManager;
        this.storage = storage;
        this.userId = userId;
        executor.scheduleWithFixedDelay(this::flush, 1, 1, TimeUnit.SECONDS);
    }

    @Override
    public void onWebSocketOpen(Session session) {
        this.session = session;
        try {
            Map<String, Collection<?>> data = new HashMap<>();
            data.put(KEY_POSITIONS, PositionUtil.getLatestPositions(storage, userId));
            sendData(data);
            connectionManager.addListener(userId, this);
        } catch (StorageException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason) {
        connectionManager.removeListener(userId, this);
        executor.shutdown();
        session = null;
    }

    @Override
    public void onWebSocketText(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            if (json.hasNonNull("logs")) {
                includeLogs = json.get("logs").asBoolean();
            }
        } catch (JsonProcessingException e) {
            LOGGER.warn("Socket JSON parsing error", e);
        }
    }

    @Override
    public void onWebSocketError(Throwable cause) {
        if (!(cause instanceof ClosedChannelException)) {
            LOGGER.warn("WebSocket error", cause);
        }
    }

    @Override
    public void onKeepalive() {
        sendData(new HashMap<>());
    }

    @Override
    public void onUpdateDevice(Device device) {
        addToBuffer(KEY_DEVICES, device);
    }

    @Override
    public void onUpdatePosition(Position position) {
        addToBuffer(KEY_POSITIONS, position);
    }

    @Override
    public void onUpdateEvent(Event event) {
        addToBuffer(KEY_EVENTS, event);
    }

    @Override
    public void onUpdateLog(LogRecord record) {
        if (includeLogs) {
            addToBuffer(KEY_LOGS, record);
        }
    }

    private synchronized void addToBuffer(String key, Object value) {
        buffer.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
    }

    private void flush() {
        Map<String, Collection<Object>> data;
        synchronized (this) {
            if (buffer.isEmpty()) {
                return;
            }
            data = new HashMap<>(buffer);
            buffer.clear();
        }
        sendData(data);
    }

    private void sendData(Map<String, ?> data) {
        if (session != null && session.isOpen()) {
            try {
                session.sendText(objectMapper.writeValueAsString(data), Callback.NOOP);
            } catch (JsonProcessingException e) {
                LOGGER.warn("Socket JSON formatting error", e);
            }
        }
    }
}