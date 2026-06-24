import { CreateOrderInput } from "@repo/schemas-types";
import { createOrder, getOrders } from "./order.repository.js";
import { AppError } from "../../lib/errors/AppError.js";
import { getMarketPrice } from "@repo/market";

export const createOrderService = async (
  userId: number,
  data: CreateOrderInput,
) => {
  const {
    symbol,
    side,
    orderType,
    qty,
    leverage,
    takeProfit,
    stopLoss,
    slippage,
  } = data;

  if (leverage < 1 || leverage > 100) {
    throw new AppError("Invalid leverage", 400);
  }
  if (orderType !== "MARKET") {
    throw new AppError("Limit orders are not implemented", 400);
  }

  const currentPrice = await getMarketPrice(symbol, side);

  if (side === "BUY") {
    if (takeProfit !== undefined && takeProfit <= currentPrice) {
      throw new AppError("Long take profit must be above market price", 400);
    }
    if (stopLoss !== undefined && stopLoss >= currentPrice) {
      throw new AppError("Long stop loss must be below market price", 400);
    }
  } else {
    if (takeProfit !== undefined && takeProfit >= currentPrice) {
      throw new AppError("Short take profit must be below market price", 400);
    }
    if (stopLoss !== undefined && stopLoss <= currentPrice) {
      throw new AppError("Short stop loss must be above market price", 400);
    }
  }

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
  return { order };
};

export const getOrdersService = async (userId: number) => {
  return getOrders(userId);
};
