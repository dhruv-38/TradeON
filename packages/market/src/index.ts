import { redis, REDIS_KEYS } from "@repo/redis";
import { Symbol, OrderSide } from "@repo/db";

export const getMarketPrice = async ( symbol: Symbol, side: OrderSide) => {
    const key = REDIS_KEYS[symbol];
    const raw = await redis.get(key);

    if (!raw) {
      throw new Error(`Price unavailable for ${symbol}`);
    }
    const price = JSON.parse(raw);

    if (Date.now() - price.timestamp > 10000) {
      throw new Error("Market data stale");
    }

    return side === OrderSide.BUY ? price.ask : price.bid;
  };