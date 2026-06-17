import { prisma } from "@repo/db";
import { redis, REDIS_CHANNELS, REDIS_KEYS } from "@repo/redis";
import { WebSocket } from "ws";

const sub = redis.duplicate();
await sub.connect();

const latestPrices = new Map<string, { bid: number; ask: number; timestamp: number }>();

// await sub.subscribe(REDIS_CHANNELS[position.symbol], (message) => {
//   latestPrices.set(position.symbol, JSON.parse(message));
// });

export const startPositionPublisher = (positionSubscribers: Map<number, Set<WebSocket>>) => {
  setInterval(async () => {
    const userIds = [...positionSubscribers.keys()];
    for (const userId of userIds) {
      const positions = await prisma.position.findMany({
          where: {
            userId,
            status: "OPEN",
          },
        });

      const sockets = positionSubscribers.get(userId);
      if (!sockets || sockets.size === 0) {
        continue;
      }

      for (const position of positions) {
        
        const rawPrice = await redis.get(REDIS_KEYS[position.symbol]);

        if (!rawPrice) {
          continue;
        }

        const market = JSON.parse(rawPrice);

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