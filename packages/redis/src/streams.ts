export const REDIS_STREAMS = {
  ORDER_STREAM: "stream.orders",

  ENGINE_COMMANDS_STREAM: "stream.engine.commands",

  ENGINE_DB_STREAM: "stream.engine.db",

  ENGINE_DLQ_STREAM: "stream.engine.dead-letter",

  ENGINE_SNAPSHOT_STREAM_PREFIX: "stream.engine.snapshot",

  MARKET_EVENTS_STREAM: "market-events",

  MARKET_TICKS_STREAM: "market-ticks",

  USER_EVENTS_STREAM: "user-events",
} as const;

export const REDIS_GROUPS = {
  ENGINE_GROUP: "engine-group",

  ENGINE_WORKER_ORDER_GROUP: "engine-worker-order-group",

  ENGINE_DB_GROUP: "engine-db-group",

  ENGINE_SYNC_GROUP: "engine-sync-group",

  BATCH_GROUP: "batch-group",

  WS_GROUP: "ws-group",
} as const;
