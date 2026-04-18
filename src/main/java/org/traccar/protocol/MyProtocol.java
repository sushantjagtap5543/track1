package org.traccar.protocol;

import org.traccar.BaseProtocol;
import org.traccar.PipelineBuilder;
import org.traccar.TrackerServer;
import org.traccar.config.Config;
import org.traccar.model.Command;

import jakarta.inject.Inject;

/**
 * Minimal implementation of a custom protocol named MyProtocol.
 * This class follows the same pattern as existing protocols (e.g., Gt06Protocol).
 * It registers a server with TCP support and adds placeholder handlers.
 */
public class MyProtocol extends BaseProtocol {

    @Inject
    public MyProtocol(Config config) {
        // Define supported commands – adjust as needed for the real protocol
        setSupportedDataCommands(
                Command.TYPE_ENGINE_STOP,
                Command.TYPE_ENGINE_RESUME,
                Command.TYPE_CUSTOM);

        // Register a TCP server (datagram = false). Handlers are placeholders.
        addServer(new TrackerServer(config, getName(), false) {
            @Override
            protected void addProtocolHandlers(PipelineBuilder pipeline, Config config) {
                // Frame decoder (if needed) – currently a pass‑through
                pipeline.addLast(new MyProtocolFrameDecoder());
                // Encoder/decoder for the protocol
                pipeline.addLast(new MyProtocolEncoder(MyProtocol.this));
                pipeline.addLast(new MyProtocolDecoder(MyProtocol.this));
            }
        });
    }
}

