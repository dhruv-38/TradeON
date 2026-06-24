import { PositionStatus, Prisma } from "@repo/db";
import { openPositions } from "@repo/market";
import { publishEngineTransition } from "@repo/redis";
import {
  forgetRecentPosition,
  rememberRecentPosition,
} from "./position-history.js";
import { getExecutableExitPrice } from "./pricing.js";

const liquidateMemoryPosition = async (
  positionId: string,
  currentPrice: number,
) => {
  const index = openPositions.findIndex(
    (position) => position.id === positionId,
  );
  if (index === -1) return;

  const position = openPositions[index]!;
  const closedAt = new Date();
  const realizedPnl = new Prisma.Decimal(position.marginUsed).negated();

  const previous = {
    status: position.status,
    realizedPnl: position.realizedPnl,
    closedAt: position.closedAt,
    closePrice: position.order.closePrice,
    closeTime: position.order.closeTime,
    orderUpdatedAt: position.order.updatedAt,
  };

  position.status = PositionStatus.LIQUIDATED;
  position.realizedPnl = realizedPnl;
  position.closedAt = closedAt;
  position.order.closePrice = new Prisma.Decimal(currentPrice);
  position.order.closeTime = closedAt;
  position.order.updatedAt = closedAt;
  openPositions.splice(index, 1);
  rememberRecentPosition(position);

  try {
    await publishEngineTransition(
      {
        type: "position.liquidated",
        positionId: position.id,
        userId: position.userId,
        exitPrice: String(currentPrice),
        realizedPnl: realizedPnl.toString(),
        closedAt: closedAt.toISOString(),
      },
      {
        userId: position.userId,
        event: "position.liquidated",
        payload: {
          positionId: position.id,
          source: "engine",
        },
      },
    );
  } catch (error) {
    forgetRecentPosition(position.id);
    position.status = previous.status;
    position.realizedPnl = previous.realizedPnl;
    position.closedAt = previous.closedAt;
    position.order.closePrice = previous.closePrice;
    position.order.closeTime = previous.closeTime;
    position.order.updatedAt = previous.orderUpdatedAt;
    openPositions.splice(Math.min(index, openPositions.length), 0, position);
    throw error;
  }
};

export const checkLiquidations = async (
  symbol: string,
  bid: number,
  ask: number,
) => {
  const positions = openPositions.filter(
    (position) => position.symbol === symbol,
  );

  for (const position of positions) {
    if (position.liquidationPrice === null) continue;
    const currentPrice = getExecutableExitPrice(position.side, bid, ask);

    const shouldLiquidate =
      position.side === "BUY"
        ? currentPrice <= Number(position.liquidationPrice)
        : currentPrice >= Number(position.liquidationPrice);

    if (shouldLiquidate) {
      console.log(`LIQUIDATED ${position.id}`);
      await liquidateMemoryPosition(position.id, currentPrice);
    }
  }
};
