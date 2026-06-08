export const REDIS_STREAMS = {
  ORDER_STREAM: "stream.orders",

  MARKET_EVENTS_STREAM:"market-events",

  MARKET_TICKS_STREAM:"market-ticks",

  USER_EVENTS_STREAM: "user-events"
} as const;

export const REDIS_GROUPS = {
  ENGINE_GROUP:"engine-group",

  BATCH_GROUP:"batch-group",
  
  WS_GROUP: "ws-group",
} as const;