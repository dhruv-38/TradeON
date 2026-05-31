import {prisma,PositionStatus,OrderSide} from "@repo/db";
import { closePosition } from "./position.engine.js";

export const checkTpSl = async (symbol: string,currentPrice: number) => {
  const positions = await prisma.position.findMany({
      where: {
        symbol: symbol as any,
        status:
          PositionStatus.OPEN,
      },
      include: {
        order: true,
      },
    });

  for (const position of positions) {

    const tp = position.order.takeProfit;

    const sl = position.order.stopLoss;

    if (position.side === OrderSide.BUY) {
      if (tp && currentPrice >= Number(tp)) {
        console.log(`TP HIT ${position.id}`);
        await closePosition(position.userId,position.id);
        continue;
      }

      if (sl && currentPrice <= Number(sl)) {
        console.log(`SL HIT ${position.id}`);
        await closePosition(position.userId,position.id);
        continue;
      }
    }

    if (position.side === OrderSide.SELL) {
      if (tp && currentPrice <= Number(tp)) {
        console.log(`TP HIT ${position.id}`);
        await closePosition(position.userId,position.id);
        continue;
      }

      if (sl && currentPrice >= Number(sl)) {
        console.log(`SL HIT ${position.id}`);
        await closePosition(position.userId,position.id);
        continue;
      }
    }
  }
};