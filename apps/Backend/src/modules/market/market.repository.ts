import { timescale } from "@repo/timescaledb";

const intervals = {
  "1m": "1 minute",
  "5m": "5 minutes",
  "1h": "1 hour",
  "4h": "4 hours",
  "1d": "1 day",
} as const;

export const getCandles = async (symbol: string, limit = 500, interval = "1m") => {
  const bucketInterval = intervals[interval as keyof typeof intervals];
  if (!bucketInterval) {
    throw new Error(`Unsupported candle interval: ${interval}`);
  }

  const result = await timescale.query(
    `SELECT *
     FROM (
       SELECT
         time_bucket($3::interval, time) AS bucket,
         symbol,
         first(ask, time) AS open,
         max(ask) AS high,
         min(ask) AS low,
         last(ask, time) AS close,
         count(*)::double precision AS volume
       FROM ticks
       WHERE symbol = $1
       GROUP BY bucket, symbol
       ORDER BY bucket DESC
       LIMIT $2
     ) candles
     ORDER BY bucket ASC`,
    [symbol, Math.min(Math.max(limit, 1), 1000), bucketInterval]
  );

  return result.rows;
};
