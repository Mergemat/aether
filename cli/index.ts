import { Client } from "node-osc";

const osc = new Client("127.0.0.1", 9000);

Bun.serve({
	port: 8888, // Changed from 9090
	hostname: "0.0.0.0",
	tls: {
		// Note the new filenames from the command above
		cert: Bun.file("./localhost+2.pem"),
		key: Bun.file("./localhost+2-key.pem"),
	},
	fetch(req, server) {
		if (server.upgrade(req)) return;
		return new Response("Bridge Active", {
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	},
	websocket: {
		message(ws, msg) {
			try {
				const { address, value } = JSON.parse(msg.toString());
				const val = parseFloat(value);

				// Log this to see EXACTLY what is being sent to TouchOSC
				console.log(
					`Sending to OSC -> Address: ${address} | Value: ${val.toFixed(3)}`,
				);

				osc.send(address, val);
			} catch (e) {
				console.error("JSON Error");
			}
		},
	},
});
