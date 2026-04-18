# MyProtocol

This document describes the custom **MyProtocol** implementation added to the Traccar server.

## Overview

`MyProtocol` is a minimal example protocol that follows the same structure as existing
protocols (e.g., `Gt06Protocol`). It registers a TCP server and provides placeholder
handler classes:

* `MyProtocolFrameDecoder` – currently a pass‑through decoder. Replace with proper
  framing logic if the protocol requires length‑field or delimiter based framing.
* `MyProtocolDecoder` – stub for decoding incoming messages into `Position`
  objects. Implement actual parsing logic here.
* `MyProtocolEncoder` – stub for encoding commands to the device.

## Configuration

Add a port configuration entry in `application.properties` (or the appropriate
configuration file) to enable the protocol, for example:

```
myprotocol.port = 5000
```

The protocol will be automatically discovered by `ServerManager` because it
extends `BaseProtocol` and is located in the `org.traccar.protocol` package.

## Supported Commands

The protocol currently supports the following command types:

* `engineStop`
* `engineResume`
* `custom`

These can be extended by modifying the `setSupportedDataCommands` call in
`MyProtocol`.

## Testing

A basic unit test `MyProtocolTest` verifies that the protocol can be instantiated
and that the supported commands are correctly registered.

Further integration tests should be added to validate message decoding and
command encoding.

