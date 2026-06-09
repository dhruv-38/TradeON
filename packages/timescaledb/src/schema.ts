import { query, withTransaction } from "./client.js";

export async function createSchema() {
  await withTransaction(async (client) => {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticks (
        time TIMESTAMPTZ NOT NULL,
        symbol TEXT NOT NULL,
        bid NUMERIC NOT NULL,
        ask NUMERIC NOT NULL
      );
    `);

    await client.query(`
      SELECT create_hypertable(
        'ticks',
        'time',
        if_not_exists => TRUE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticks_symbol_time
      ON ticks (symbol, time DESC);
    `);

    await client.query(`
      DO $$
      BEGIN
        BEGIN
          EXECUTE $view$
            CREATE MATERIALIZED VIEW candles_1m
            WITH (timescaledb.continuous) AS
            SELECT
              time_bucket('1 minute', time) AS bucket,
              symbol,
              first(ask, time) AS open,
              max(ask) AS high,
              min(ask) AS low,
              last(ask, time) AS close
            FROM ticks
            GROUP BY bucket, symbol
            WITH NO DATA
          $view$;
        EXCEPTION
          WHEN duplicate_table THEN NULL;
        END;
      END
      $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        BEGIN
          EXECUTE $view$
            CREATE MATERIALIZED VIEW candles_5m
            WITH (timescaledb.continuous) AS
            SELECT
              time_bucket('5 minutes', time) AS bucket,
              symbol,
              first(ask, time) AS open,
              max(ask) AS high,
              min(ask) AS low,
              last(ask, time) AS close
            FROM ticks
            GROUP BY bucket, symbol
            WITH NO DATA
          $view$;
        EXCEPTION
          WHEN duplicate_table THEN NULL;
        END;
      END
      $$;
    `);

    await client.query(`
      SELECT add_continuous_aggregate_policy(
        'candles_1m',
        start_offset => INTERVAL '1 day',
        end_offset => INTERVAL '1 minute',
        schedule_interval => INTERVAL '30 seconds',
        if_not_exists => TRUE
      );
    `);

    console.log("TimescaleDB schema created successfully");
  });
}

export async function refreshCandles() {
  await query("CALL refresh_continuous_aggregate('candles_1m', NULL, NULL);");
  await query("CALL refresh_continuous_aggregate('candles_5m', NULL, NULL);");
}
