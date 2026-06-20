import { prisma } from "@repo/db";
import { WebSocket } from "ws";
import { latestPrices, openPositions } from "@repo/market";

export const startPositionPublisher = (positionSubscribers: Map<number, Set<WebSocket>>) => {
  setInterval(async () => {
    const userIds = [...positionSubscribers.keys()];
    for (const userId of userIds) {
      // const positions = await prisma.position.findMany({
      //     where: {
      //       userId,
      //       status: "OPEN",
      //     },
      //   });

      const sockets = positionSubscribers.get(userId);
      if (!sockets || sockets.size === 0) {
        continue;
      }

      for (const position of openPositions) {
        const market = latestPrices.get(position.symbol);

        if (!market) {
          continue;
        }

        const currentPrice = Number(market.ask);

        let unrealizedPnl = 0;

        if (position.side === "BUY") {

          unrealizedPnl =(currentPrice - Number(position.entryPrice)) * Number(position.qty);
        } else {
          unrealizedPnl = (Number(position.entryPrice) - currentPrice) * Number(position.qty);
        }

        const payload = {
          type: "position.update",
          positionId:position.id,
          symbol:position.symbol,
          side:position.side,
          qty:Number(position.qty),
          leverage:position.leverage,
          entryPrice:Number(position.entryPrice),
          currentPrice,
          unrealizedPnl,
          liquidationPrice:Number(position.liquidationPrice),
        };

        for (const socket of sockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
          }
        }
      }
    }

  }, 1000);
};
