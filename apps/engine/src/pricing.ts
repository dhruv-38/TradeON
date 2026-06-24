import type { OrderSide } from "@repo/db";

export function getExitSide(positionSide: OrderSide): OrderSide {
  return positionSide === "BUY" ? "SELL" : "BUY";
}

export function getExecutableExitPrice(
  positionSide: OrderSide,
  bid: number,
  ask: number,
) {
  return positionSide === "BUY" ? bid : ask;
}

export function calculateRealizedPnl(
  positionSide: OrderSide,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
) {
  return positionSide === "BUY"
    ? (exitPrice - entryPrice) * quantity
    : (entryPrice - exitPrice) * quantity;
}
