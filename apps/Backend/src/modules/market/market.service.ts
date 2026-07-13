import { getCandles } from "./market.repository.js";

export const getCandlesService = async (
  symbol: string,
  limit: number,
  interval: string,
  before?: string,
) => {
  return getCandles(symbol, limit, interval, before);
};
