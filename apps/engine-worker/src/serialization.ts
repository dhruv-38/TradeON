import type { Order, Position } from "@repo/db";
import type { SerializedOrder, SerializedPosition } from "@repo/redis";

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

export const serializePosition = (
  position: Position & { order: Order },
): SerializedPosition => ({
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
