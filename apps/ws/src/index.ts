import { WebSocketServer, WebSocket } from "ws";
import { broadcastPrices } from "./price.publisher.js";

const wss = new WebSocketServer({ port: 8080 });
const clients = new Set<WebSocket>;
const userSockets = new Map<number, Set<WebSocket>>();

wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("Client connected");

    ws.send(JSON.stringify({ type: "connected" }));
    ws.on("message", (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe") {
            const userId = Number(msg.userId);
            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }

            userSockets.get(userId)!.add(ws);

            console.log(`User ${userId} subscribed`);
        }
    });

    ws.on("close", () => {
        clients.delete(ws);
        for (const [, sockets] of userSockets) {
            sockets.delete(ws);
        }
        console.log("Client disconnected");
    });
});

broadcastPrices(clients);

console.log("WS Server running on :8080");