import { openPositions } from "@repo/market";
import { closeMemoryPosition } from "./position.engine.js";

export const checkTpSl = async (symbol: string, currentPrice: number) => {
  const positions = openPositions.filter(
    (position) => position.symbol === symbol,
  );

  for (const position of positions) {
    const takeProfit = position.order.takeProfit;
    const stopLoss = position.order.stopLoss;

    const takeProfitHit =
      takeProfit !== null &&
      (position.side === "BUY"
        ? currentPrice >= Number(takeProfit)
        : currentPrice <= Number(takeProfit));

    if (takeProfitHit) {
      console.log(`TP HIT ${position.id}`);
      await closeMemoryPosition(position.id, "TAKE_PROFIT", currentPrice);
      continue;
    }

    const stopLossHit =
      stopLoss !== null &&
      (position.side === "BUY"
        ? currentPrice <= Number(stopLoss)
        : currentPrice >= Number(stopLoss));

    if (stopLossHit) {
      console.log(`SL HIT ${position.id}`);
      await closeMemoryPosition(position.id, "STOP_LOSS", currentPrice);
    }
  }
};
