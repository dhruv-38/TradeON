import { PositionStatus, Prisma } from "@repo/db";
import { getMarketPrice, openPositions } from "@repo/market";
import { publishEngineDbEvent } from "@repo/redis";

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
  if (index === -1) return;

  const position = openPositions[index]!;
  if (expectedUserId !== undefined && position.userId !== expectedUserId) {
    throw new Error("Position does not belong to this user");
  }

  const exitSide = position.side === "BUY" ? "SELL" : "BUY";
  const exitPrice = knownPrice ?? getMarketPrice(position.symbol, exitSide);
  const realizedPnl =
    position.side === "BUY"
      ? (exitPrice - Number(position.entryPrice)) * Number(position.qty)
      : (Number(position.entryPrice) - exitPrice) * Number(position.qty);
  const closedAt = new Date();

  await publishEngineDbEvent({
    type: "position.closed",
    positionId: position.id,
    userId: position.userId,
    exitPrice: String(exitPrice),
    realizedPnl: String(realizedPnl),
    closedAt: closedAt.toISOString(),
    reason,
  });

  position.status = PositionStatus.CLOSED;
  position.realizedPnl = new Prisma.Decimal(realizedPnl);
  position.closedAt = closedAt;
  position.order.closePrice = new Prisma.Decimal(exitPrice);
  position.order.closeTime = closedAt;
  position.order.updatedAt = closedAt;
  openPositions.splice(index, 1);
};

export const removeExternallyClosedPosition = (positionId: string) => {
  const index = openPositions.findIndex(
    (position) => position.id === positionId,
  );
  if (index === -1) return;

  const position = openPositions[index]!;
  position.status = PositionStatus.CLOSED;
  position.order.closeTime = new Date();
  position.order.updatedAt = new Date();
  openPositions.splice(index, 1);
};
