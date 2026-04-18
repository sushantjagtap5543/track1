package org.traccar.protocol;

import io.netty.channel.Channel;
import java.net.SocketAddress;
import org.traccar.BaseProtocolDecoder;
import org.traccar.Protocol;

/**
 * Placeholder decoder for MyProtocol. It demonstrates the required method signatures
 * but does not implement actual parsing logic. Real implementation should decode
 * incoming messages and produce Position objects.
 */
public class MyProtocolDecoder extends BaseProtocolDecoder {

    public MyProtocolDecoder(Protocol protocol) {
        super(protocol);
    }

    @Override
    protected Object decode(Channel channel, SocketAddress remoteAddress, Object msg) throws Exception {
        // TODO: implement actual decoding logic for MyProtocol
        return null;
    }
}

