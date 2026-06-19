import { latestPrices } from "@repo/market";
import WebSocket from "ws";

export const broadcastPrices = async (clients: Set<WebSocket>) => {
  setInterval(() => {
    const btc = latestPrices.get("BTC_USDC");
    const eth = latestPrices.get("ETH_USDC");
    const sol = latestPrices.get("SOL_USDC");

    const payload = {
      type: "prices",
      BTC_USDC: btc ?? null,
      ETH_USDC: eth ?? null,
      SOL_USDC: sol ?? null,
    };

    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }
    }
  }, 1000);
};
