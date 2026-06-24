import { handleStreamFailure, redis, REDIS_STREAMS } from "@repo/redis";
import { checkTpSl } from "./tpsl.engine.js";
import { checkLiquidations } from "./liquidation.engine.js";

const GROUP = "market-group";
const CONSUMER = "engine-1";

export const startMarketConsumer = async () => {
  const client = redis.duplicate();
  await client.connect();

  try {
    await client.xGroupCreate(REDIS_STREAMS.MARKET_EVENTS_STREAM, GROUP, "$", {
      MKSTREAM: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }

  while (true) {
    const pending = await client.xReadGroup(
      GROUP,
      CONSUMER,
      [{ key: REDIS_STREAMS.MARKET_EVENTS_STREAM, id: "0" }],
      { COUNT: 10 },
    );
    const messages = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          GROUP,
          CONSUMER,
          [{ key: REDIS_STREAMS.MARKET_EVENTS_STREAM, id: ">" }],
          { COUNT: 10, BLOCK: 5000 },
        );

    if (!messages) continue;

    for (const stream of messages) {
      for (const message of stream.messages) {
        try {
          const symbol = String(message.message.symbol);
          const bid = Number(message.message.bid);
          const ask = Number(message.message.ask);
          if (!Number.isFinite(bid) || !Number.isFinite(ask)) {
            throw new Error("Market event has invalid bid/ask prices");
          }

          await checkLiquidations(symbol, bid, ask);
          await checkTpSl(symbol, bid, ask);

          await client.xAck(
            REDIS_STREAMS.MARKET_EVENTS_STREAM,
            GROUP,
            message.id,
          );
        } catch (error) {
          console.error("Market event failed:", error);
          await handleStreamFailure(
            client,
            REDIS_STREAMS.MARKET_EVENTS_STREAM,
            GROUP,
            message.id,
            message.message,
            error,
          );
        }
      }
    }
  }
};
