import { OrderStatus, prisma } from "@repo/db";
import {
  parseJsonEvent,
  publishEngineCommand,
  redis,
  REDIS_GROUPS,
  REDIS_STREAMS,
  type EngineDbEvent,
} from "@repo/redis";
import { persistEngineEvent } from "./persistence.js";
import { serializeOrder } from "./serialization.js";

const ORDER_CONSUMER = "engine-worker-order-1";
const DB_CONSUMER = "engine-worker-db-1";
const SYNC_CONSUMER = "engine-worker-sync-1";

const createGroup = async (
  client: Pick<typeof redis, "xGroupCreate">,
  stream: string,
  group: string,
) => {
  try {
    await client.xGroupCreate(stream, group, "0", { MKSTREAM: true });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }
};

const startOrderLoader = async () => {
  const client = redis.duplicate();
  await client.connect();
  await createGroup(
    client,
    REDIS_STREAMS.ORDER_STREAM,
    REDIS_GROUPS.ENGINE_WORKER_ORDER_GROUP,
  );

  while (true) {
    const pending = await client.xReadGroup(
      REDIS_GROUPS.ENGINE_WORKER_ORDER_GROUP,
      ORDER_CONSUMER,
      [{ key: REDIS_STREAMS.ORDER_STREAM, id: "0" }],
      { COUNT: 10 },
    );
    const response = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          REDIS_GROUPS.ENGINE_WORKER_ORDER_GROUP,
          ORDER_CONSUMER,
          [{ key: REDIS_STREAMS.ORDER_STREAM, id: ">" }],
          { COUNT: 10, BLOCK: 5000 },
        );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        try {
          const orderId = Number(message.message.orderId);
          if (!Number.isInteger(orderId)) {
            throw new Error("Order stream event has an invalid orderId");
          }

          const order = await prisma.order.findUnique({
            where: { id: orderId },
          });

          if (order?.status === OrderStatus.PENDING) {
            await publishEngineCommand({
              type: "order.loaded",
              order: serializeOrder(order),
            });
          }

          await client.xAck(
            REDIS_STREAMS.ORDER_STREAM,
            REDIS_GROUPS.ENGINE_WORKER_ORDER_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("Order loading failed:", error);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }
  }
};

const startPersistenceConsumer = async () => {
  const client = redis.duplicate();
  await client.connect();
  await createGroup(
    client,
    REDIS_STREAMS.ENGINE_DB_STREAM,
    REDIS_GROUPS.ENGINE_DB_GROUP,
  );

  while (true) {
    const pending = await client.xReadGroup(
      REDIS_GROUPS.ENGINE_DB_GROUP,
      DB_CONSUMER,
      [{ key: REDIS_STREAMS.ENGINE_DB_STREAM, id: "0" }],
      { COUNT: 10 },
    );
    const response = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          REDIS_GROUPS.ENGINE_DB_GROUP,
          DB_CONSUMER,
          [{ key: REDIS_STREAMS.ENGINE_DB_STREAM, id: ">" }],
          { COUNT: 10, BLOCK: 5000 },
        );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        try {
          const event = parseJsonEvent<EngineDbEvent>(message.message.payload);
          await persistEngineEvent(event);
          await client.xAck(
            REDIS_STREAMS.ENGINE_DB_STREAM,
            REDIS_GROUPS.ENGINE_DB_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("Engine DB event failed:", error);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }
  }
};

const startExternalPositionSync = async () => {
  const client = redis.duplicate();
  await client.connect();
  await createGroup(
    client,
    REDIS_STREAMS.USER_EVENTS_STREAM,
    REDIS_GROUPS.ENGINE_SYNC_GROUP,
  );

  while (true) {
    const pending = await client.xReadGroup(
      REDIS_GROUPS.ENGINE_SYNC_GROUP,
      SYNC_CONSUMER,
      [{ key: REDIS_STREAMS.USER_EVENTS_STREAM, id: "0" }],
      { COUNT: 20 },
    );
    const response = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          REDIS_GROUPS.ENGINE_SYNC_GROUP,
          SYNC_CONSUMER,
          [{ key: REDIS_STREAMS.USER_EVENTS_STREAM, id: ">" }],
          { COUNT: 20, BLOCK: 5000 },
        );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        try {
          const event = message.message.event;
          const positionId = message.message.positionId;
          const source = message.message.source;

          if (
            positionId &&
            source !== "engine" &&
            (event === "position.closed" || event === "position.liquidated")
          ) {
            await publishEngineCommand({
              type: "position.external.closed",
              positionId,
            });
          }

          await client.xAck(
            REDIS_STREAMS.USER_EVENTS_STREAM,
            REDIS_GROUPS.ENGINE_SYNC_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("External position sync failed:", error);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }
  }
};

console.log("Engine worker started");

await Promise.all([
  startOrderLoader(),
  startPersistenceConsumer(),
  startExternalPositionSync(),
]);
