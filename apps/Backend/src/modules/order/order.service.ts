import { CreateOrderInput } from "@repo/schemas-types";
import { reserveFunds } from "../wallet/wallet.repository.js";
import { createOrder } from "./order.repository.js";
import { AppError } from "../../lib/errors/AppError.js";

export const createOrderService = async (userId: number,data: CreateOrderInput) => {
  const {symbol,side,orderType,qty,leverage,takeProfit,stopLoss,slippage,} = data;

  if (leverage < 1 || leverage > 100) {
    throw new AppError("Invalid leverage",400);
  }
  // TEMPORARY HARDCODED PRICE
  const currentPrice = 100000;

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

  return {order};
};
