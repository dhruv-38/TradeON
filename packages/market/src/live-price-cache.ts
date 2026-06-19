import { redis } from "@repo/redis";
import type { Symbol } from "@repo/db";

type LivePrice = {
  bid: number;
  ask: number;
  timestamp: number;
};

export const latestPrices = new Map<string, LivePrice>();
const REQUIRED_SYMBOLS: Symbol[] = ["BTC_USDC", "ETH_USDC", "SOL_USDC"];

let cacheStartPromise: Promise<void> | null = null;

export const startLivePriceCache = async () => {
  if (cacheStartPromise) {
    return cacheStartPromise;
  }

  cacheStartPromise = (async () => {
    try {
      const sub = redis.duplicate();
      await sub.connect();

      await sub.pSubscribe("price:*", (message, channel) => {
        const symbol = channel.replace("price:", "");
        latestPrices.set(symbol, JSON.parse(message) as LivePrice);
      });
    } catch (error) {
      cacheStartPromise = null;
      throw error;
    }
  })();

  return cacheStartPromise;
};

export const waitForLivePriceCacheReady = async (
  symbols: Symbol[] = REQUIRED_SYMBOLS,
  timeoutMs = 15000,
) => {
  const startedAt = Date.now();

  while (symbols.some((symbol) => !latestPrices.has(symbol))) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(
        `Timed out waiting for live prices: ${symbols.filter((symbol) => !latestPrices.has(symbol)).join(", ")}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};
