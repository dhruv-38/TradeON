import { prisma, OrderStatus, Prisma, PositionStatus, OrderSide } from "@repo/db";
import { getMarketPrice } from "@repo/market";
import { releaseFundsTx } from "@repo/trading";

const rejectOrder = async (tx: Prisma.TransactionClient, orderId: number) => {
  return tx.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: OrderStatus.REJECTED,
    },
  });
};

export const executeOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    }
  });
  if (!order) { throw new Error("Order not found"); }

  if (order.status !== OrderStatus.PENDING) {
    throw new Error("Order already processed");
  }


  const marketPrice = await getMarketPrice(order.symbol, order.side);

  const slippagePercent = Math.abs(marketPrice - Number(order.expectedPrice)) / Number(order.expectedPrice) * 100;

  return await prisma.$transaction(async (tx) => {
    if (order.slippage !== null && slippagePercent > Number(order.slippage)) {

      await releaseFundsTx(tx, order.userId, Number(order.marginUsed));

      await rejectOrder(tx, order.id);

      return {
        rejected: true,
      };
    }

    const actualPositionValue = Number(order.qty) * marketPrice;

    const actualMarginRequired = actualPositionValue / order.leverage;
    const allowedMargin = Number(order.marginUsed) * 1.02;

    if (actualMarginRequired > allowedMargin) {
      await releaseFundsTx(tx, order.userId, Number(order.marginUsed));

      await rejectOrder(tx, order.id);
      return {
        rejected: true,
      };
    }

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

    const maintenanceMarginRate = 0.01;
    let liquidationPrice: number;

    if (order.side === OrderSide.BUY) {
      liquidationPrice = marketPrice * (1 -((1 / order.leverage) -maintenanceMarginRate));
    } else {
      liquidationPrice = marketPrice *(1 +((1 / order.leverage) -maintenanceMarginRate));
    }
    const position = await tx.position.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        qty: order.qty,
        leverage: order.leverage,
        marginUsed: order.marginUsed,
        liquidationPrice: new Prisma.Decimal(liquidationPrice),
        maintenanceMargin: new Prisma.Decimal(maintenanceMarginRate),
        entryPrice: new Prisma.Decimal(marketPrice),
        status: PositionStatus.OPEN,
      },
    });

    return { order: updatedOrder, position };
  });
};