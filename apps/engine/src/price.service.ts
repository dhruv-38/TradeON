import { OrderSide, Symbol } from "@repo/db";
import { redis, REDIS_KEYS } from "@repo/redis";

export const getMarketPrice = async ( symbol: Symbol, side: OrderSide ) => {
    const key = REDIS_KEYS[symbol];
    const raw = await redis.get(key);

    if (!raw) {
      throw new Error(`Price unavailable for ${symbol}`);
    }

    const price = JSON.parse(raw);

    if ( Date.now() - price.timestamp > 10000) {
      throw new Error("Market data stale");
    }

    return side === "BUY" ? price.ask : price.bid;
  };