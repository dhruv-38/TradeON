import { timescale } from "@repo/timescaledb";

const intervals = {
  "1m": { sql: "1 minute", milliseconds: 60_000 },
  "5m": { sql: "5 minutes", milliseconds: 5 * 60_000 },
  "1h": { sql: "1 hour", milliseconds: 60 * 60_000 },
  "4h": { sql: "4 hours", milliseconds: 4 * 60 * 60_000 },
  "1d": { sql: "1 day", milliseconds: 24 * 60 * 60_000 },
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
  const windowStart = new Date(
    beforeDate.getTime() - intervalConfig.milliseconds * (pageLimit + 1),
  );

  const result = await timescale.query<CandleRow>(
    `SELECT *
     FROM (
       SELECT
         time_bucket($3::interval, bucket) AS bucket,
         symbol,
         first(open, bucket) AS open,
         max(high) AS high,
         min(low) AS low,
         last(close, bucket) AS close
       FROM candles_1m
       WHERE symbol = $1
         AND bucket >= $4::timestamptz
         AND bucket < $5::timestamptz
       GROUP BY bucket, symbol
       ORDER BY bucket DESC
       LIMIT $2
     ) candles
     ORDER BY bucket ASC`,
    [
      symbol,
      pageLimit + 1,
      intervalConfig.sql,
      windowStart.toISOString(),
      beforeDate.toISOString(),
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
