import { config } from "@repo/config";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { broadcastPrices } from "./price.publisher.js";
import { startUserEventsConsumer } from "./user-events.consumer.js";
import { startLivePriceCache } from "@repo/market";

type JwtPayload = {
  id: number;
  email: string;
};

const wss = new WebSocketServer({ port: 8080 });
const clients = new Set<WebSocket>();
const userSockets = new Map<number, Set<WebSocket>>();

wss.on("connection", (ws, request) => {
  const token = getCookie(request.headers.cookie, "jwt");
  const userId = verifyUserId(token);
  if (userId === null) {
    ws.close(1008, "Unauthorized");
    return;
  }

  clients.add(ws);
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(ws);

  ws.send(JSON.stringify({ type: "connected" }));

  ws.on("close", () => {
    clients.delete(ws);
    const sockets = userSockets.get(userId);
    sockets?.delete(ws);
    if (sockets?.size === 0) {
      userSockets.delete(userId);
    }
  });
});

await startLivePriceCache();
void broadcastPrices(clients);
void startUserEventsConsumer(userSockets).catch((error) => {
  console.error("User event consumer stopped:", error);
  process.exit(1);
});

console.log("WS Server running on :8080");

function getCookie(header: string | undefined, name: string) {
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return undefined;
}

function verifyUserId(token: string | undefined) {
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    return Number.isInteger(payload.id) ? payload.id : null;
  } catch {
    return null;
  }
}
