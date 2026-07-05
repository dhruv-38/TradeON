import WebSocket from "ws";
import { config } from "@repo/config";
import {
  redis,
  REDIS_CHANNELS,
  REDIS_STREAMS,
  xAddWithMaxLen,
} from "@repo/redis";

const RECONNECT_DELAY_MS = 2_000;
const STALE_CONNECTION_MS = 20_000;
const WATCHDOG_INTERVAL_MS = 5_000;

let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let isShuttingDown = false;

function scheduleReconnect() {
  if (isShuttingDown || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, RECONNECT_DELAY_MS);
}

function connect() {
  const ws = new WebSocket(config.BACKPACK_WS_URL);
  let lastTickerAt = Date.now();
  let watchdog: ReturnType<typeof setInterval> | undefined;

  ws.on("open", () => {
    console.log("Connected to Backpack market data");
    lastTickerAt = Date.now();
    ws.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: [
          "bookTicker.BTC_USDC",
          "bookTicker.ETH_USDC",
          "bookTicker.SOL_USDC",
        ],
      }),
    );

    watchdog = setInterval(() => {
      if (Date.now() - lastTickerAt > STALE_CONNECTION_MS) {
        console.warn("Backpack market data is stale; reconnecting...");
        ws.terminate();
      }
    }, WATCHDOG_INTERVAL_MS);
  });

  ws.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (!message.stream || !message.data) {
        return;
      }
      const data = message.data;

      if (data.e !== "bookTicker") {
        return;
      }

      lastTickerAt = Date.now();

      const payload = {
        bid: Number(data.b),
        ask: Number(data.a),
        timestamp: Date.now(),
      };

      switch (data.s) {
        case "BTC_USDC":
          await redis.publish(REDIS_CHANNELS.BTC_USDC, JSON.stringify(payload));
          // await redis.set(REDIS_KEYS.BTC_USDC, JSON.stringify(payload));
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_EVENTS_STREAM, "*", {
            event: "market.price.updated",
            symbol: data.s,
            bid: String(payload.bid),
            ask: String(payload.ask),
          });
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_TICKS_STREAM, "*", {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp: String(payload.timestamp),
          });
          break;

        case "ETH_USDC":
          await redis.publish(REDIS_CHANNELS.ETH_USDC, JSON.stringify(payload));
          // await redis.set(REDIS_KEYS.ETH_USDC, JSON.stringify(payload));
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_EVENTS_STREAM, "*", {
            event: "market.price.updated",
            symbol: data.s,
            bid: String(payload.bid),
            ask: String(payload.ask),
          });
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_TICKS_STREAM, "*", {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp: String(payload.timestamp),
          });
          break;

        case "SOL_USDC":
          await redis.publish(REDIS_CHANNELS.SOL_USDC, JSON.stringify(payload));
          // await redis.set(REDIS_KEYS.SOL_USDC, JSON.stringify(payload));
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_EVENTS_STREAM, "*", {
            event: "market.price.updated",
            symbol: data.s,
            bid: String(payload.bid),
            ask: String(payload.ask),
          });
          await xAddWithMaxLen(redis, REDIS_STREAMS.MARKET_TICKS_STREAM, "*", {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp: String(payload.timestamp),
          });
          break;
      }
    } catch (error) {
      console.error(error);
    }
  });

  ws.on("close", () => {
    if (watchdog) {
      clearInterval(watchdog);
    }
    console.log("Backpack WS disconnected; reconnecting...");
    scheduleReconnect();
  });

  ws.on("error", (error) => {
    console.error("Backpack WS error:", error);
    ws.terminate();
  });
}

process.on("SIGINT", () => {
  isShuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
});

connect();
