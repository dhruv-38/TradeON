import { PositionStatus, Prisma } from "@repo/db";
import { openPositions } from "@repo/market";
import { publishEngineDbEvent, publishUserEvent } from "@repo/redis";
import {
  forgetRecentPosition,
  rememberRecentPosition,
} from "./position-history.js";

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

  await publishEngineDbEvent({
    type: "position.liquidated",
    positionId: position.id,
    userId: position.userId,
    exitPrice: String(currentPrice),
    closedAt: closedAt.toISOString(),
  });

  const previous = {
    status: position.status,
    closedAt: position.closedAt,
    closePrice: position.order.closePrice,
    closeTime: position.order.closeTime,
    orderUpdatedAt: position.order.updatedAt,
  };

  position.status = PositionStatus.LIQUIDATED;
  position.closedAt = closedAt;
  position.order.closePrice = new Prisma.Decimal(currentPrice);
  position.order.closeTime = closedAt;
  position.order.updatedAt = closedAt;
  openPositions.splice(index, 1);
  rememberRecentPosition(position);

  try {
    await publishUserEvent(position.userId, "position.liquidated", {
      positionId: position.id,
      source: "engine",
    });
  } catch (error) {
    forgetRecentPosition(position.id);
    position.status = previous.status;
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
  currentPrice: number,
) => {
  const positions = openPositions.filter(
    (position) => position.symbol === symbol,
  );

  for (const position of positions) {
    if (position.liquidationPrice === null) continue;

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
