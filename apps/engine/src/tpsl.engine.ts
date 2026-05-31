import {prisma,PositionStatus} from "@repo/db";
import { getMarketPrice } from "@repo/market";

export const checkTpSl = async (symbol: string) => {
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
        const currentPrice =await getMarketPrice(position.symbol,position.side);

      const tp = position.order.takeProfit;

      const sl = position.order.stopLoss;

      if (position.side === "BUY") {
        if (tp && currentPrice >= Number(tp)) {
          console.log(`TP hit for position ${position.id}`);
        }

        if (sl && currentPrice <= Number(sl)) {
          console.log(`SL hit for position ${position.id}`);
        }
      }

      if (position.side === "SELL") {
        if (tp && currentPrice <= Number(tp)) {
          console.log(`TP hit for position ${position.id}`);
        }

        if (sl && currentPrice >= Number(sl)) {
          console.log(`SL hit for position ${position.id}`);
        }
      }
    }
  };