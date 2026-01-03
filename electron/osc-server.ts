import { Bundle, Client } from "node-osc";
import { WebSocketServer, WebSocket } from "ws";

const OSC_PORT = 7099;
const WS_PORT = 8888;

let oscClient: Client | null = null;
let wsServer: WebSocketServer | null = null;

interface OscMessage {
  address: string;
  value: number;
}

/**
 * Decode binary OSC messages for minimal latency.
 * Format per message: [1 byte addr length][N bytes addr][4 bytes float32 value]
 */
function decodeBinaryMessages(buffer: Buffer): OscMessage[] {
  const messages: OscMessage[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const addrLen = buffer.readUInt8(offset);
    offset += 1;

    const address = buffer.toString("ascii", offset, offset + addrLen);
    offset += addrLen;

    const value = buffer.readFloatLE(offset);
    offset += 4;

    messages.push({ address, value });
  }

  return messages;
}

/**
 * Send OSC messages - single message direct, multiple as bundle.
 */
function sendOscMessages(messages: OscMessage[]) {
  if (!oscClient || messages.length === 0) {
    return;
  }

  if (messages.length === 1 && messages[0]) {
    // Single message: send directly (lowest latency)
    oscClient.send(messages[0].address, messages[0].value);
  } else if (messages.length > 1) {
    // Multiple messages: use OSC bundle (single UDP packet)
    const bundle = new Bundle(
      0, // timetag 0 = immediately
      ...messages.map(({ address, value }) => ({
        address,
        args: [value],
      }))
    );
    oscClient.send(bundle);
  }
}

export function startOscServer(): void {
  // Create OSC client
  oscClient = new Client("127.0.0.1", OSC_PORT);

  // Create WebSocket server
  wsServer = new WebSocketServer({
    port: WS_PORT,
    host: "0.0.0.0",
  });

  wsServer.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg: Buffer | ArrayBuffer | string) => {
      // Binary protocol (Buffer) - minimal latency path
      if (Buffer.isBuffer(msg)) {
        const messages = decodeBinaryMessages(msg);
        sendOscMessages(messages);
        return;
      }

      // ArrayBuffer -> convert to Buffer
      if (msg instanceof ArrayBuffer) {
        const buffer = Buffer.from(msg);
        const messages = decodeBinaryMessages(buffer);
        sendOscMessages(messages);
        return;
      }

      // Legacy JSON fallback
      if (typeof msg === "string") {
        try {
          const data = JSON.parse(msg);
          const messages: OscMessage[] = Array.isArray(data) ? data : [data];
          sendOscMessages(messages);
        } catch {
          console.error("[OSC Server] Malformed message received");
        }
      }
    });

    ws.on("error", (err: Error) => {
      console.error("[OSC Server] WebSocket error:", err.message);
    });
  });

  wsServer.on("error", (err: Error) => {
    console.error("[OSC Server] Server error:", err.message);
  });

  console.log(`[OSC Server] WebSocket listening on ws://0.0.0.0:${WS_PORT}`);
  console.log(`[OSC Server] OSC sending to 127.0.0.1:${OSC_PORT}`);
}

export function stopOscServer(): void {
  if (wsServer) {
    // Close all connected clients
    wsServer.clients.forEach((client) => {
      client.close();
    });
    wsServer.close();
    wsServer = null;
  }

  if (oscClient) {
    oscClient.close();
    oscClient = null;
  }

  console.log("[OSC Server] Stopped");
}
