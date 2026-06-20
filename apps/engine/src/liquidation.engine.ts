import { PositionStatus } from "@repo/db";
import { openPositions } from "@repo/market";
import { publishEngineDbEvent } from "@repo/redis";

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

  position.status = PositionStatus.LIQUIDATED;
  position.closedAt = closedAt;
  position.order.closeTime = closedAt;
  position.order.updatedAt = closedAt;
  openPositions.splice(index, 1);
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
