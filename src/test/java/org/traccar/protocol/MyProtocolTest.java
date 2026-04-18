package org.traccar.protocol;

import org.junit.jupiter.api.Test;
import org.traccar.ProtocolTest;
import org.traccar.model.Command;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Basic unit test for MyProtocol components.
 * Tests decoder and encoder directly to avoid TrackerServer injector dependency.
 */
public class MyProtocolTest extends ProtocolTest {

    @Test
    public void testDecoder() throws Exception {
        var decoder = inject(new MyProtocolDecoder(null));
        assertNotNull(decoder);
        // Verify it doesn't crash on null message
        assertNull(decoder.decode(null, null, null));
    }

    @Test
    public void testEncoder() throws Exception {
        var encoder = inject(new MyProtocolEncoder(null));
        assertNotNull(encoder);
        // Verify it doesn't crash on sample command
        Command command = new Command();
        command.setType(Command.TYPE_ENGINE_STOP);
        assertNull(encoder.encodeCommand(null, command));
    }
}
