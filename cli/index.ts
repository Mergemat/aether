import { Bundle, Client } from "node-osc";

const osc = new Client("127.0.0.1", 7099);

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
	if (messages.length === 1 && messages[0]) {
		// Single message: send directly (lowest latency)
		osc.send(messages[0].address, messages[0].value);
	} else if (messages.length > 1) {
		// Multiple messages: use OSC bundle (single UDP packet)
		const bundle = new Bundle(
			0, // timetag 0 = immediately
			...messages.map(({ address, value }) => ({
				address,
				args: [value],
			})),
		);
		osc.send(bundle);
	}
}

Bun.serve({
	port: 8888,
	hostname: "0.0.0.0",
	fetch(req, server) {
		const success = server.upgrade(req);
		if (success) return undefined; // Handled by websocket
		return new Response("Not a WebSocket request", { status: 400 });
	},
	websocket: {
		open(ws) {
			console.log("Client connected");
		},
		message(ws, msg) {
			// Binary protocol (ArrayBuffer/Buffer) - minimal latency path
			if (msg instanceof Buffer || msg instanceof ArrayBuffer) {
				const buffer = msg instanceof Buffer ? msg : Buffer.from(msg);
				const messages = decodeBinaryMessages(buffer);
				sendOscMessages(messages);
				return;
			}

			// Legacy JSON fallback
			try {
				const data = JSON.parse(msg.toString());
				const messages: OscMessage[] = Array.isArray(data) ? data : [data];
				sendOscMessages(messages);
			} catch (e) {
				console.error("Malformed message received");
			}
		},
		close(ws, code, message) {
			// Code 1001 = Tab refreshed/closed
			// Code 1006 = Abnormal (network/crash)
			console.log(
				`Disconnected. Code: ${code}, Reason: ${message || "No reason"}`,
			);
		},
	},
});
