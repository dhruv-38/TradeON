import { timescale } from "./client.js";
import { createSchema, refreshCandles } from "./schema.js";

async function main() {
  try {
    await createSchema();

    const range = await timescale.query<{
      min_time: Date | null;
      max_time: Date | null;
    }>("SELECT min(time) AS min_time, max(time) AS max_time FROM ticks;");
    const minTime = range.rows[0]?.min_time;
    const maxTime = range.rows[0]?.max_time;

    if (!minTime || !maxTime) {
      console.log("No ticks are available to backfill");
      return;
    }

    const minuteMilliseconds = 60_000;
    const dayMilliseconds = 24 * 60 * 60_000;
    let windowStart = new Date(
      Math.floor(minTime.getTime() / minuteMilliseconds) * minuteMilliseconds,
    );
    const backfillEnd = new Date(
      Math.floor(maxTime.getTime() / minuteMilliseconds) * minuteMilliseconds,
    );

    console.log(
      `Backfilling 1-minute candles from ${windowStart.toISOString()} to ${backfillEnd.toISOString()}...`,
    );

    while (windowStart < backfillEnd) {
      const windowEnd = new Date(
        Math.min(windowStart.getTime() + dayMilliseconds, backfillEnd.getTime()),
      );
      await refreshCandles(windowStart, windowEnd);
      console.log(`Backfilled candles through ${windowEnd.toISOString()}`);
      windowStart = windowEnd;
    }

    console.log("Candle backfill completed");
  } finally {
    await timescale.end();
  }
}

main().catch((error) => {
  console.error("Failed to backfill candles:", error);
  process.exit(1);
});
