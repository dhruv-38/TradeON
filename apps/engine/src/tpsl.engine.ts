import { prisma, PositionStatus, OrderSide } from "@repo/db";
import { closePosition } from "@repo/trading";
import { publishUserEvent } from "@repo/redis";

export const checkTpSl = async (symbol: string, currentPrice: number) => {
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
        await closePosition(position.userId, position.id);
        await publishUserEvent(position.userId, "position.tp",
          {
            positionId: String(position.id),
          }
        );
        continue;
      }

      if (sl && currentPrice <= Number(sl)) {
        console.log(`SL HIT ${position.id}`);
        await closePosition(position.userId, position.id);
        await publishUserEvent(position.userId, "position.sl",
          {
            positionId: String(position.id),
          }
        );
        continue;
      }
    }

    if (position.side === OrderSide.SELL) {
      if (tp && currentPrice <= Number(tp)) {
        console.log(`TP HIT ${position.id}`);
        await closePosition(position.userId, position.id);
        await publishUserEvent(position.userId, "position.tp",
          {
            positionId: String(position.id),
          }
        );
        continue;
      }

      if (sl && currentPrice >= Number(sl)) {
        console.log(`SL HIT ${position.id}`);
        await closePosition(position.userId, position.id);
        continue;
      }
    }
  }
};