import { Symbol, OrderSide } from "@repo/db";
import { latestPrices } from "./live-price-cache.js";

export const getMarketPrice = (symbol: Symbol, side: OrderSide) => {
  const price = latestPrices.get(symbol);

  if (!price) {
    throw new Error(`Price unavailable for ${symbol}`);
  }

  if (Date.now() - price.timestamp > 10000) {
    throw new Error("Market data stale");
  }

  return side === OrderSide.BUY ? price.ask : price.bid;
};

export * from "./live-price-cache.js";
export * from "./live-data-store.js";
