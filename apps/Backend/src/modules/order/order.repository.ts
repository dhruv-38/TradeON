import { prisma } from "@repo/db";
import { OrderSide, OrderStatus, OrderType, Symbol, Prisma } from "@repo/db";

interface CreateOrderRepositoryInput {
  userId: number;
  orderType: OrderType;
  side: OrderSide;
  symbol: Symbol;
  qty: number;
  leverage: number;
  marginUsed: number;
  takeProfit?: number;
  stopLoss?: number;
  slippage?: number;
}

export const createOrder = async (
  data: CreateOrderRepositoryInput
) => {
  return await prisma.order.create({
    data: {
      userId: data.userId,

      orderType: data.orderType,
      side: data.side,
      symbol: data.symbol,

      qty: new Prisma.Decimal(data.qty),

      leverage: data.leverage,

      marginUsed: new Prisma.Decimal(data.marginUsed),

      takeProfit: data.takeProfit
        ? new Prisma.Decimal(data.takeProfit)
        : undefined,

      stopLoss: data.stopLoss
        ? new Prisma.Decimal(data.stopLoss)
        : undefined,

      slippage: data.slippage
        ? new Prisma.Decimal(data.slippage)
        : undefined,

      status: OrderStatus.PENDING,
    },
  });
};
