import { randomUUID } from "node:crypto";
import {
  openPositions,
  recentPositionHistory,
  startLivePriceCache,
} from "@repo/market";
import {
  parseJsonEvent,
  publishEngineDbEvent,
  redis,
  REDIS_GROUPS,
  REDIS_STREAMS,
  type EngineCommand,
  type EngineSnapshot,
  type LivePositionState,
} from "@repo/redis";
import { executeOrder } from "./execution.engine.js";
import { startMarketConsumer } from "./market.consumer.js";
import {
  hydrateEngineMemory,
  serializePosition,
  upsertMemoryOrder,
} from "./serialization.js";
import { removeExternallyClosedPosition } from "./position.engine.js";

const CONSUMER_NAME = "engine-1";

const requestSnapshot = async () => {
  const responseStream = `${REDIS_STREAMS.ENGINE_SNAPSHOT_STREAM_PREFIX}:${randomUUID()}`;

  await publishEngineDbEvent({
    type: "engine.snapshot.requested",
    responseStream,
  });

  try {
    while (true) {
      const response = await redis.xRead([{ key: responseStream, id: "0" }], {
        COUNT: 1,
        BLOCK: 5000,
      });
      const message = response?.[0]?.messages[0];

      if (message) {
        return parseJsonEvent<EngineSnapshot>(message.message.payload);
      }

      console.log("Waiting for engine-worker snapshot...");
    }
  } finally {
    await redis.del(responseStream);
  }
};

const createGroup = async (client: typeof redis) => {
  try {
    await client.xGroupCreate(
      REDIS_STREAMS.ENGINE_COMMANDS_STREAM,
      REDIS_GROUPS.ENGINE_GROUP,
      "0",
      { MKSTREAM: true },
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }
};

const handleCommand = async (command: EngineCommand) => {
  if (command.type === "order.loaded") {
    const order = upsertMemoryOrder(command.order);
    await executeOrder(order.id);
    return;
  }

  if (command.type === "positions.live.requested") {
    const state: LivePositionState = {
      openPositions: openPositions
        .filter((position) => position.userId === command.userId)
        .map(serializePosition),
      recentHistory: recentPositionHistory
        .filter((position) => position.userId === command.userId)
        .map(serializePosition),
    };

    await redis.xAdd(command.responseStream, "*", {
      payload: JSON.stringify(state),
    });
    await redis.expire(command.responseStream, 30);
    return;
  }

  await removeExternallyClosedPosition(command.positionId);
};

const startConsumer = async () => {
  const client = redis.duplicate();
  await client.connect();
  await createGroup(client);

  while (true) {
    const pending = await client.xReadGroup(
      REDIS_GROUPS.ENGINE_GROUP,
      CONSUMER_NAME,
      [{ key: REDIS_STREAMS.ENGINE_COMMANDS_STREAM, id: "0" }],
      { COUNT: 10 },
    );
    const response = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          REDIS_GROUPS.ENGINE_GROUP,
          CONSUMER_NAME,
          [{ key: REDIS_STREAMS.ENGINE_COMMANDS_STREAM, id: ">" }],
          { COUNT: 10, BLOCK: 5000 },
        );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        try {
          const command = parseJsonEvent<EngineCommand>(
            message.message.payload,
          );
          await handleCommand(command);
          await client.xAck(
            REDIS_STREAMS.ENGINE_COMMANDS_STREAM,
            REDIS_GROUPS.ENGINE_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("Engine command failed:", error);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }
  }
};

await startLivePriceCache();

const snapshot = await requestSnapshot();
hydrateEngineMemory(snapshot);
console.log(
  `Engine hydrated ${snapshot.orders.length} orders and ${openPositions.length} positions`,
);

void startConsumer();
void startMarketConsumer();

console.log("In-memory engine started");
