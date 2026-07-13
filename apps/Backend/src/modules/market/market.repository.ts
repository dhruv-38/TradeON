import { timescale } from "@repo/timescaledb";

const intervals = {
  "1m": { sql: "1 minute", sourceMinutes: 1 },
  "5m": { sql: "5 minutes", sourceMinutes: 5 },
  "1h": { sql: "1 hour", sourceMinutes: 60 },
  "4h": { sql: "4 hours", sourceMinutes: 4 * 60 },
  "1d": { sql: "1 day", sourceMinutes: 24 * 60 },
} as const;

type CandleRow = {
  bucket: Date;
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export const getCandles = async (
  symbol: string,
  limit = 120,
  interval = "1m",
  before?: string,
) => {
  const intervalConfig = intervals[interval as keyof typeof intervals];
  if (!intervalConfig) {
    throw new Error(`Unsupported candle interval: ${interval}`);
  }

  const pageLimit = Math.min(Math.max(limit, 1), 500);
  const beforeDate = before ? new Date(before) : new Date();
  const sourceLimit = (pageLimit + 1) * intervalConfig.sourceMinutes;

  const result = await timescale.query<CandleRow>(
    `WITH source_candles AS (
       SELECT bucket, symbol, open, high, low, close
       FROM candles_1m
       WHERE symbol = $1
         AND bucket < $4::timestamptz
       ORDER BY bucket DESC
       LIMIT $5
     )
     SELECT *
     FROM (
       SELECT
         time_bucket($3::interval, bucket) AS bucket,
         symbol,
         first(open, bucket) AS open,
         max(high) AS high,
         min(low) AS low,
         last(close, bucket) AS close
       FROM source_candles
       GROUP BY time_bucket($3::interval, bucket), symbol
       ORDER BY bucket DESC
       LIMIT $2
     ) candles
     ORDER BY bucket ASC`,
    [
      symbol,
      pageLimit + 1,
      intervalConfig.sql,
      beforeDate.toISOString(),
      sourceLimit,
    ],
  );

  const hasMore = result.rows.length > pageLimit;
  const candles = hasMore ? result.rows.slice(1) : result.rows;

  return {
    candles,
    hasMore,
    nextCursor: hasMore ? candles[0]?.bucket.toISOString() ?? null : null,
  };
};
