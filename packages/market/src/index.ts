import { redis, REDIS_CHANNELS } from "@repo/redis";
import { Symbol, OrderSide } from "@repo/db";

const sub= redis.duplicate();
await sub.connect();

const latestPrices = new Map<string,{bid:number,ask:number,timestamp:number}>();

export const getMarketPrice = async ( symbol: Symbol, side: OrderSide) => {
    // const key = REDIS_KEYS[symbol];
    // const raw = await redis.get(key);
    await sub.subscribe(REDIS_CHANNELS[symbol], (message) => {
      latestPrices.set(symbol, JSON.parse(message));
    });
    const price=latestPrices.get(REDIS_CHANNELS[symbol]);
    

    // if (!raw) {
    //   throw new Error(`Price unavailable for ${symbol}`);
    // }
    if (!price) {
      throw new Error(`Price unavailable for ${symbol}`);
    }
    // const price = JSON.parse(raw);

    if (Date.now() - price.timestamp > 10000) {
      throw new Error("Market data stale");
    }

    return side === OrderSide.BUY ? price.ask : price.bid;
  };