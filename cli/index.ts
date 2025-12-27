import { Client } from "node-osc";

const osc = new Client("127.0.0.1", 9000);

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
			console.log("Raw message received:", msg.toString()); // Add this
			try {
				const { address, value } = JSON.parse(msg.toString());
				const val = parseFloat(value);
				osc.send(address, val);
			} catch (e) {
				console.error("Malformed JSON received");
			}
		},
		close(ws, code, message) {
			// Code 1001 = Tab refreshed/closed
			// Code 1006 = Abnormal (network/crash)
			console.log(
				`❌ Disconnected. Code: ${code}, Reason: ${message || "No reason"}`,
			);
		},
	},
});
