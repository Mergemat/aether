// Connected UDP skips the per-send address lookup
const osc = await Bun.udpSocket({
    connect: { hostname: "127.0.0.1", port: 7099 },
    socket: {
        // Nothing may be listening on the OSC port yet; that's not worth a crash
        error() {},
    },
});

Bun.serve({
    port: 8888,
    hostname: "0.0.0.0",
    fetch(req, server) {
        const success = server.upgrade(req);
        if (success) return undefined; // Handled by websocket
        return new Response("Not a WebSocket request", { status: 400 });
    },
    websocket: {
        // The dashboard sends finished OSC packets (one message or a bundle
        // per frame), so each frame is forwarded as-is as one UDP datagram
        message(_ws, msg) {
            if (typeof msg !== "string") {
                osc.send(msg);
            }
        },
    },
});
