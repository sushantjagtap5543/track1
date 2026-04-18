package org.traccar.protocol;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import java.util.List;

/**
 * Simple frame decoder that forwards the received ByteBuf without modification.
 * Replace with proper framing logic if the protocol requires length‑field or delimiter based framing.
 */
public class MyProtocolFrameDecoder extends ByteToMessageDecoder {

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        // Pass through the raw bytes to the next handler.
        out.add(in.readBytes(in.readableBytes()));
    }
}

