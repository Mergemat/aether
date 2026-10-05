import { createSocket, type Socket } from "node:dgram";
import { type RawData, WebSocketServer } from "ws";

const OSC_HOST = "127.0.0.1";
const OSC_PORT = 7099;
const WS_PORT = 8888;

let udp: Socket | null = null;
let wsServer: WebSocketServer | null = null;

// Nothing may be listening on the OSC port; dropped packets are fine
const ignoreSendError = () => undefined;

/**
 * The dashboard sends finished OSC packets (one message or a bundle per
 * WebSocket frame), so each frame is forwarded as-is as one UDP datagram.
 */
function forward(data: RawData, isBinary: boolean) {
  if (!(isBinary && udp && Buffer.isBuffer(data))) {
    return;
  }
  udp.send(data, OSC_PORT, OSC_HOST, ignoreSendError);
}

export function startOscServer(): void {
  // Unconnected on purpose: a connected socket reports ICMP "port
  // unreachable" as an error on every send while no OSC receiver is running
  udp = createSocket("udp4");
  udp.on("error", (err) => {
    console.error("[OSC Server] UDP error:", err.message);
  });

  wsServer = new WebSocketServer({
    port: WS_PORT,
    host: "0.0.0.0",
  });

  wsServer.on("connection", (ws) => {
    ws.on("message", forward);
    ws.on("error", (err: Error) => {
      console.error("[OSC Server] WebSocket error:", err.message);
    });
  });

  wsServer.on("error", (err: Error) => {
    console.error("[OSC Server] Server error:", err.message);
  });

  console.log(`[OSC Server] WebSocket listening on ws://0.0.0.0:${WS_PORT}`);
  console.log(`[OSC Server] OSC sending to ${OSC_HOST}:${OSC_PORT}`);
}

export function stopOscServer(): void {
  if (wsServer) {
    // Close all connected clients
    for (const client of wsServer.clients) {
      client.close();
    }
    wsServer.close();
    wsServer = null;
  }

  if (udp) {
    udp.close();
    udp = null;
  }

  console.log("[OSC Server] Stopped");
}
