import { timescale } from "@repo/timescaledb";

export const getCandles = async (symbol: string,limit = 500) => {

  const result = await timescale.query(
      `SELECT * FROM candles_1m 
      WHERE symbol = $1 ORDER BY bucket DESC LIMIT $2`,
      [symbol, limit]
    );

  return result.rows;
};