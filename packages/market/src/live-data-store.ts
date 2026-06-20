import { Prisma, Symbol, OrderSide, PositionStatus, OrderType, OrderStatus } from '@repo/db';

export type Order = {
  id: number;

  userId: number;

  orderType: OrderType;
  side: OrderSide;
  symbol: Symbol;

  qty: Prisma.Decimal;
  leverage: number;

  expectedPrice: Prisma.Decimal;

  takeProfit: Prisma.Decimal | null;
  stopLoss: Prisma.Decimal | null;
  slippage: Prisma.Decimal | null;

  marginUsed: Prisma.Decimal;

  executionPrice: Prisma.Decimal | null;
  closePrice: Prisma.Decimal | null;

  executedAt: Date | null;
  closeTime: Date | null;

  status: OrderStatus;

  createdAt: Date;
  updatedAt: Date;
};

export type Position = {
  id: string;

  userId: number;
  orderId: number;

  order:Order,

  symbol: Symbol;
  side: OrderSide;

  qty: Prisma.Decimal;

  leverage: number;

  entryPrice: Prisma.Decimal;

  marginUsed: Prisma.Decimal;

  liquidationPrice: Prisma.Decimal | null;

  maintenanceMargin: Prisma.Decimal;

  unrealizedPnl: Prisma.Decimal;

  realizedPnl: Prisma.Decimal;

  status: PositionStatus;

  openedAt: Date;
  closedAt: Date | null;
};

export const openPositions: Position[] =[];
export const orders: Order[] = [];