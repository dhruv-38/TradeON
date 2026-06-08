import { getCandles } from "./market.repository.js";

export const getCandlesService = async (symbol: string, limit: number) => {
  return getCandles(symbol, limit);
};