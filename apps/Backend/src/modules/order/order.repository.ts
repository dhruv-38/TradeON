import { prisma } from "@repo/db";
import { OrderSide, OrderStatus, OrderType, Symbol, Prisma } from "@repo/db";
import { reserveFunds } from "../wallet/wallet.repository.js";

interface CreateOrderRepositoryInput {
  userId: number;
  orderType: OrderType;
  side: OrderSide;
  symbol: Symbol;
  qty: number;
  leverage: number;
  expectedPrice: number;
  marginUsed: number;
  takeProfit?: number;
  stopLoss?: number;
  slippage?: number;
}

export const createOrder = async (data: CreateOrderRepositoryInput) => {
  return await prisma.$transaction(async (tx) => {
    await reserveFunds(tx, data.userId, Number(data.marginUsed));
    const result = await tx.order.create({
      data: {
        userId: data.userId,
        orderType: data.orderType,
        side: data.side,
        symbol: data.symbol,
        qty: new Prisma.Decimal(data.qty),
        leverage: data.leverage,
        marginUsed: new Prisma.Decimal(data.marginUsed),
        expectedPrice: new Prisma.Decimal(data.expectedPrice),
        takeProfit: data.takeProfit ? new Prisma.Decimal(data.takeProfit) : undefined,
        stopLoss: data.stopLoss ? new Prisma.Decimal(data.stopLoss) : undefined,
        slippage: data.slippage ? new Prisma.Decimal(data.slippage) : undefined,
        status: OrderStatus.PENDING,
      },
    })
    return result;
  })
};


export const getOrders = async (userId: number) => {
  return prisma.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
