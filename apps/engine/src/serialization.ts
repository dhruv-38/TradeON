import {
  OrderSide,
  OrderStatus,
  OrderType,
  PositionStatus,
  Prisma,
  Symbol,
} from "@repo/db";
import type { Order, Position } from "@repo/market";
import type {
  EngineSnapshot,
  SerializedOrder,
  SerializedPosition,
} from "@repo/redis";
import { openPositions, orders } from "@repo/market";

export const serializeOrder = (order: Order): SerializedOrder => ({
  id: order.id,
  userId: order.userId,
  orderType: order.orderType,
  side: order.side,
  symbol: order.symbol,
  qty: order.qty.toString(),
  leverage: order.leverage,
  expectedPrice: order.expectedPrice.toString(),
  takeProfit: order.takeProfit?.toString() ?? null,
  stopLoss: order.stopLoss?.toString() ?? null,
  slippage: order.slippage?.toString() ?? null,
  marginUsed: order.marginUsed.toString(),
  executionPrice: order.executionPrice?.toString() ?? null,
  closePrice: order.closePrice?.toString() ?? null,
  executedAt: order.executedAt?.toISOString() ?? null,
  closeTime: order.closeTime?.toISOString() ?? null,
  status: order.status,
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
});

export const deserializeOrder = (order: SerializedOrder): Order => ({
  id: order.id,
  userId: order.userId,
  orderType: order.orderType as OrderType,
  side: order.side as OrderSide,
  symbol: order.symbol as Symbol,
  qty: new Prisma.Decimal(order.qty),
  leverage: order.leverage,
  expectedPrice: new Prisma.Decimal(order.expectedPrice),
  takeProfit:
    order.takeProfit === null ? null : new Prisma.Decimal(order.takeProfit),
  stopLoss: order.stopLoss === null ? null : new Prisma.Decimal(order.stopLoss),
  slippage: order.slippage === null ? null : new Prisma.Decimal(order.slippage),
  marginUsed: new Prisma.Decimal(order.marginUsed),
  executionPrice:
    order.executionPrice === null
      ? null
      : new Prisma.Decimal(order.executionPrice),
  closePrice:
    order.closePrice === null ? null : new Prisma.Decimal(order.closePrice),
  executedAt: order.executedAt === null ? null : new Date(order.executedAt),
  closeTime: order.closeTime === null ? null : new Date(order.closeTime),
  status: order.status as OrderStatus,
  createdAt: new Date(order.createdAt),
  updatedAt: new Date(order.updatedAt),
});

export const serializePosition = (position: Position): SerializedPosition => ({
  id: position.id,
  userId: position.userId,
  orderId: position.orderId,
  order: serializeOrder(position.order),
  symbol: position.symbol,
  side: position.side,
  qty: position.qty.toString(),
  leverage: position.leverage,
  entryPrice: position.entryPrice.toString(),
  marginUsed: position.marginUsed.toString(),
  liquidationPrice: position.liquidationPrice?.toString() ?? null,
  maintenanceMargin: position.maintenanceMargin.toString(),
  unrealizedPnl: position.unrealizedPnl.toString(),
  realizedPnl: position.realizedPnl.toString(),
  status: position.status,
  openedAt: position.openedAt.toISOString(),
  closedAt: position.closedAt?.toISOString() ?? null,
});

export const deserializePosition = (
  position: SerializedPosition,
): Position => ({
  id: position.id,
  userId: position.userId,
  orderId: position.orderId,
  order: deserializeOrder(position.order),
  symbol: position.symbol as Symbol,
  side: position.side as OrderSide,
  qty: new Prisma.Decimal(position.qty),
  leverage: position.leverage,
  entryPrice: new Prisma.Decimal(position.entryPrice),
  marginUsed: new Prisma.Decimal(position.marginUsed),
  liquidationPrice:
    position.liquidationPrice === null
      ? null
      : new Prisma.Decimal(position.liquidationPrice),
  maintenanceMargin: new Prisma.Decimal(position.maintenanceMargin),
  unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
  realizedPnl: new Prisma.Decimal(position.realizedPnl),
  status: position.status as PositionStatus,
  openedAt: new Date(position.openedAt),
  closedAt: position.closedAt === null ? null : new Date(position.closedAt),
});

export const hydrateEngineMemory = (snapshot: EngineSnapshot) => {
  orders.length = 0;
  openPositions.length = 0;

  for (const order of snapshot.orders) {
    orders.push(deserializeOrder(order));
  }

  for (const position of snapshot.positions) {
    const memoryPosition = deserializePosition(position);
    const memoryOrder = orders.find(
      (order) => order.id === memoryPosition.orderId,
    );

    if (memoryOrder) {
      memoryPosition.order = memoryOrder;
    } else {
      orders.push(memoryPosition.order);
    }

    openPositions.push(memoryPosition);
  }
};

export const upsertMemoryOrder = (serialized: SerializedOrder) => {
  const existing = orders.find((order) => order.id === serialized.id);
  if (existing) return existing;

  const order = deserializeOrder(serialized);
  orders.push(order);
  return order;
};
