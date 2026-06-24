import { randomUUID } from "node:crypto";
import { OrderSide, OrderStatus, PositionStatus, Prisma } from "@repo/db";
import {
  getMarketPrice,
  openPositions,
  orders,
  type Position,
} from "@repo/market";
import { publishEngineTransition } from "@repo/redis";
import { serializeOrder, serializePosition } from "./serialization.js";

const MAINTENANCE_MARGIN_RATE = 0.01;
const MARGIN_TOLERANCE = 1.02;

const rejectOrder = async (
  order: (typeof orders)[number],
  reason: "SLIPPAGE" | "MARGIN_EXCEEDED",
) => {
  const previousStatus = order.status;
  const previousUpdatedAt = order.updatedAt;
  order.status = OrderStatus.REJECTED;
  order.updatedAt = new Date();

  try {
    await publishEngineTransition(
      {
        type: "order.rejected",
        orderId: order.id,
        userId: order.userId,
        marginUsed: order.marginUsed.toString(),
        reason,
      },
      {
        userId: order.userId,
        event: "order.rejected",
        payload: {
          orderId: String(order.id),
          reason,
          source: "engine",
        },
      },
    );
  } catch (error) {
    order.status = previousStatus;
    order.updatedAt = previousUpdatedAt;
    throw error;
  }
};

export const executeOrder = async (orderId: number) => {
  const order = orders.find((candidate) => candidate.id === orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found in engine memory`);
  }

  if (order.status !== OrderStatus.PENDING) {
    return;
  }

  const marketPrice = getMarketPrice(order.symbol, order.side);
  const slippagePercent =
    (Math.abs(marketPrice - Number(order.expectedPrice)) /
      Number(order.expectedPrice)) *
    100;

  if (order.slippage !== null && slippagePercent > Number(order.slippage)) {
    await rejectOrder(order, "SLIPPAGE");
    return;
  }

  const actualMarginRequired =
    (Number(order.qty) * marketPrice) / order.leverage;

  if (actualMarginRequired > Number(order.marginUsed) * MARGIN_TOLERANCE) {
    await rejectOrder(order, "MARGIN_EXCEEDED");
    return;
  }

  const executedAt = new Date();
  const filledOrder = {
    ...order,
    status: OrderStatus.FILLED,
    executionPrice: new Prisma.Decimal(marketPrice),
    executedAt,
    updatedAt: executedAt,
  };

  const liquidationPrice =
    order.side === OrderSide.BUY
      ? marketPrice * (1 - (1 / order.leverage - MAINTENANCE_MARGIN_RATE))
      : marketPrice * (1 + (1 / order.leverage - MAINTENANCE_MARGIN_RATE));

  const position: Position = {
    id: randomUUID(),
    userId: order.userId,
    orderId: order.id,
    order: filledOrder,
    symbol: order.symbol,
    side: order.side,
    qty: order.qty,
    leverage: order.leverage,
    entryPrice: new Prisma.Decimal(marketPrice),
    marginUsed: order.marginUsed,
    liquidationPrice: new Prisma.Decimal(liquidationPrice),
    maintenanceMargin: new Prisma.Decimal(MAINTENANCE_MARGIN_RATE),
    unrealizedPnl: new Prisma.Decimal(0),
    realizedPnl: new Prisma.Decimal(0),
    status: PositionStatus.OPEN,
    openedAt: executedAt,
    closedAt: null,
  };

  const previousOrder = { ...order };
  Object.assign(order, filledOrder);
  position.order = order;
  openPositions.push(position);

  try {
    await publishEngineTransition(
      {
        type: "position.opened",
        order: serializeOrder(order),
        position: serializePosition(position),
      },
      {
        userId: order.userId,
        event: "position.opened",
        payload: {
          positionId: position.id,
          orderId: String(order.id),
          source: "engine",
        },
      },
    );
  } catch (error) {
    const positionIndex = openPositions.findIndex(
      (candidate) => candidate.id === position.id,
    );
    if (positionIndex !== -1) {
      openPositions.splice(positionIndex, 1);
    }
    Object.assign(order, previousOrder);
    throw error;
  }
};
