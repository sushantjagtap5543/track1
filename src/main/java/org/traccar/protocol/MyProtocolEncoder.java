package org.traccar.protocol;

import io.netty.channel.Channel;
import org.traccar.BaseProtocolEncoder;
import org.traccar.Protocol;
import org.traccar.model.Command;

/**
 * Placeholder encoder for MyProtocol. Real implementation should convert commands
 * into the protocol's wire format.
 */
public class MyProtocolEncoder extends BaseProtocolEncoder {

    public MyProtocolEncoder(Protocol protocol) {
        super(protocol);
    }

    @Override
    protected Object encodeCommand(Channel channel, Command command) {
        // TODO: implement actual encoding logic for MyProtocol commands
        return null;
    }
}

