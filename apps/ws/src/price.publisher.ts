import { redis, REDIS_CHANNELS, REDIS_KEYS } from "@repo/redis";
import WebSocket from "ws";
import { latestPrices } from "./position.publisher.js";

export const broadcastPrices = async (clients:Set<WebSocket>) => {
  setInterval(async () => {
    // const btc = await redis.get(REDIS_KEYS.BTC_USDC);
    // const eth = await redis.get(REDIS_KEYS.ETH_USDC);
    // const sol = await redis.get(REDIS_KEYS.SOL_USDC);
    const btc =latestPrices.get(REDIS_CHANNELS.BTC_USDC);
    const eth =latestPrices.get(REDIS_CHANNELS.ETH_USDC);
    const sol =latestPrices.get(REDIS_CHANNELS.SOL_USDC);

    // const payload = {
    //   type: "prices",
    //   BTC_USDC: btc ? JSON.parse(btc) : null,
    //   ETH_USDC: eth ? JSON.parse(eth) : null,
    //   SOL_USDC: sol ? JSON.parse(sol) : null,
    // };
    const payload = {
      type: "prices",
      BTC_USDC: btc ? btc : null,
      ETH_USDC: eth ? eth : null,
      SOL_USDC: sol ? sol : null,
    };

    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }
    }
  }, 1000);
};