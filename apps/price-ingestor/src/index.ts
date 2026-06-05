import WebSocket from "ws";
import { config } from "@repo/config";
import { redis, REDIS_KEYS, REDIS_STREAMS } from "@repo/redis"

const ws = new WebSocket(config.BACKPACK_WS_URL);

ws.on("open", () => {
  console.log("Connected");
  ws.send(JSON.stringify({
    method: "SUBSCRIBE",
    params: [
      "bookTicker.BTC_USDC",
      "bookTicker.ETH_USDC",
      "bookTicker.SOL_USDC",
    ],
  }));
});

let count = 0;
ws.on("message", async (raw) => {
  try {
    const message = JSON.parse(raw.toString());
    if (count < 3) {
      console.log(JSON.stringify(message, null, 2));
      count++;
    }

    if (!message.stream || !message.data) {
      return;
    }
    const data = message.data;

    if (data.e !== "bookTicker") {
      return;
    }

    const payload = {
      bid: Number(data.b),
      ask: Number(data.a),
      timestamp: Date.now(),
    };

    switch (data.s) {
      case "BTC_USDC":
        await redis.set(REDIS_KEYS.BTC_USDC, JSON.stringify(payload));
        await redis.xAdd(REDIS_STREAMS.MARKET_EVENTS_STREAM, "*",
          {
            event: "market.price.updated",
            symbol: data.s,
            price: String(payload.ask),
          }
        );
        await redis.xAdd(REDIS_STREAMS.MARKET_TICKS_STREAM,"*",
          {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp:String(payload.timestamp),
          }
        );
        break;

      case "ETH_USDC":
        await redis.set(REDIS_KEYS.ETH_USDC, JSON.stringify(payload));
        await redis.xAdd(REDIS_STREAMS.MARKET_EVENTS_STREAM, "*",
          {
            event: "market.price.updated",
            symbol: data.s,
            price: String(payload.ask),
          }
        );
        await redis.xAdd(REDIS_STREAMS.MARKET_TICKS_STREAM,"*",
          {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp:String(payload.timestamp),
          }
        );
        break;

      case "SOL_USDC":
        await redis.set(REDIS_KEYS.SOL_USDC, JSON.stringify(payload));
        await redis.xAdd(REDIS_STREAMS.MARKET_EVENTS_STREAM, "*",
          {
            event: "market.price.updated",
            symbol: data.s,
            price: String(payload.ask),
          }
        );
        await redis.xAdd(REDIS_STREAMS.MARKET_TICKS_STREAM,"*",
          {
            symbol: data.s,

            bid: String(payload.bid),

            ask: String(payload.ask),

            timestamp:String(payload.timestamp),
          }
        );
        break;
    }
  } catch (error) {
    console.error(error);
  }
});

ws.on("close", () => {
  console.log("Backpack WS disconnected");
});

ws.on("error", (err) => {
  console.error("WS Error:", err);
});