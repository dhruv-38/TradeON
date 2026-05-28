import { prisma, OrderStatus, Prisma } from "@repo/db";

export const executeOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    }});
  if (!order) { throw new Error("Order not found"); }

  if ( order.status !== OrderStatus.PENDING ) {
    throw new Error("Order already processed");
  }

  // TEMP market price
  const marketPrice = 100000;

  const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: OrderStatus.FILLED,

        executionPrice:
          new Prisma.Decimal(
            marketPrice
          ),

        executedAt: new Date(),
      },
    });

  return updatedOrder;
};