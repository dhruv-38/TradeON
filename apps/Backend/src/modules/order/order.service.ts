import { CreateOrderInput } from "@repo/schemas-types";
import { createOrder, getOrders } from "./order.repository.js";
import { AppError } from "../../lib/errors/AppError.js";
import { redis, REDIS_STREAMS } from "@repo/redis";
import { getMarketPrice, orders as memOrder } from "@repo/market";

export const createOrderService = async (userId: number, data: CreateOrderInput) => {
  const { symbol, side, orderType, qty, leverage, takeProfit, stopLoss, slippage, } = data;

  if (leverage < 1 || leverage > 100) {
    throw new AppError("Invalid leverage", 400);
  }

  const currentPrice = await getMarketPrice(symbol, side);

  // Position Value
  const positionValue = qty * currentPrice;

  // Required Margin
  const marginRequired = positionValue / leverage;


  const order = await createOrder({
    userId,
    symbol,
    side,
    orderType,
    qty,
    leverage,
    marginUsed: marginRequired,
    expectedPrice: currentPrice,
    takeProfit,
    stopLoss,
    slippage,
  });
  if (!memOrder.some(o => o.id === order.id)) {
    memOrder.push(order);
  }

  await redis.xAdd(REDIS_STREAMS.ORDER_STREAM, "*",
    {
      event: "order.created",
      orderId: order.id.toString(),
      userId: order.userId.toString(),
    });

  return { order };
};

export const getOrdersService = async (userId: number) => {
  return getOrders(userId);
};
