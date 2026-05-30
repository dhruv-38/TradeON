import { prisma, OrderStatus, Prisma, PositionStatus } from "@repo/db";
import { getMarketPrice } from "./price.service.js";

export const executeOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    }});
  if (!order) { throw new Error("Order not found"); }

  if ( order.status !== OrderStatus.PENDING ) {
    throw new Error("Order already processed");
  }

  
  const marketPrice = await getMarketPrice(order.symbol,order.side);

  return await prisma.$transaction(async (tx) => {
  const updatedOrder = await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: OrderStatus.FILLED,
      executionPrice: new Prisma.Decimal(marketPrice),
      executedAt: new Date(),
    },
  });

  const position = await tx.position.create({
    data: {
      userId: order.userId,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      leverage: order.leverage,
      entryPrice: new Prisma.Decimal(marketPrice),
      status: PositionStatus.OPEN,
    },
  });

  return { order: updatedOrder, position };
});
};

console.log(`Order ${message.message.orderId} executed`);