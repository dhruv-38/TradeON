import { PositionStatus, Prisma } from "@repo/db";
import { getMarketPrice, openPositions } from "@repo/market";
import { publishEngineTransition } from "@repo/redis";
import {
  forgetRecentPosition,
  rememberRecentPosition,
} from "./position-history.js";
import { calculateRealizedPnl, getExitSide } from "./pricing.js";

export type CloseReason = "USER" | "TAKE_PROFIT" | "STOP_LOSS";

export const closeMemoryPosition = async (
  positionId: string,
  reason: CloseReason,
  knownPrice?: number,
  expectedUserId?: number,
) => {
  const index = openPositions.findIndex(
    (position) => position.id === positionId,
  );
  if (index === -1) {
    throw new Error("Open position not found");
  }

  const position = openPositions[index]!;
  if (expectedUserId !== undefined && position.userId !== expectedUserId) {
    throw new Error("Position does not belong to this user");
  }

  const exitSide = getExitSide(position.side);
  const exitPrice = knownPrice ?? getMarketPrice(position.symbol, exitSide);
  const realizedPnl = calculateRealizedPnl(
    position.side,
    Number(position.entryPrice),
    exitPrice,
    Number(position.qty),
  );
  const closedAt = new Date();

  const previous = {
    status: position.status,
    realizedPnl: position.realizedPnl,
    closedAt: position.closedAt,
    closePrice: position.order.closePrice,
    closeTime: position.order.closeTime,
    orderUpdatedAt: position.order.updatedAt,
  };

  position.status = PositionStatus.CLOSED;
  position.realizedPnl = new Prisma.Decimal(realizedPnl);
  position.closedAt = closedAt;
  position.order.closePrice = new Prisma.Decimal(exitPrice);
  position.order.closeTime = closedAt;
  position.order.updatedAt = closedAt;
  openPositions.splice(index, 1);
  rememberRecentPosition(position);

  try {
    await publishEngineTransition(
      {
        type: "position.closed",
        positionId: position.id,
        userId: position.userId,
        exitPrice: String(exitPrice),
        realizedPnl: String(realizedPnl),
        closedAt: closedAt.toISOString(),
        reason,
      },
      {
        userId: position.userId,
        event: "position.closed",
        payload: {
          positionId: position.id,
          reason,
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

  return position;
};
