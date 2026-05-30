import { CreateOrderInput } from "@repo/schemas-types";
import { reserveFunds } from "../wallet/wallet.repository.js";
import { createOrder } from "./order.repository.js";
import { AppError } from "../../lib/errors/AppError.js";
import {redis, REDIS_STREAMS} from "@repo/redis";
import {getMarketPrice} from "@repo/market";

export const createOrderService = async (userId: number,data: CreateOrderInput) => {
  const {symbol,side,orderType,qty,leverage,takeProfit,stopLoss,slippage,} = data;

  if (leverage < 1 || leverage > 100) {
    throw new AppError("Invalid leverage",400);
  }
  
  const currentPrice = await getMarketPrice(symbol,side);

  // Position Value
  const positionValue = qty * currentPrice;

  // Required Margin
  const marginRequired = positionValue / leverage;

  // Reserve collateral
  await reserveFunds(userId,marginRequired);

  const order = await createOrder({
    userId,
    symbol,
    side,
    orderType,
    qty,
    leverage,
    marginUsed: marginRequired,
    takeProfit,
    stopLoss,
    slippage,
  });

  await redis.xAdd(REDIS_STREAMS.ORDER_STREAM,"*",
  {
    event: "order.created",
    orderId: order.id.toString(),
    userId: order.userId.toString(),
  });

  return {order};
};
