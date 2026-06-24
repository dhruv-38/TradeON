import { OrderStatus, prisma } from "@repo/db";
import {
  handleStreamFailure,
  parseJsonEvent,
  publishEngineCommand,
  publishUserEvent,
  redis,
  REDIS_GROUPS,
  REDIS_STREAMS,
  type EngineDbEvent,
} from "@repo/redis";
import { persistEngineEvent } from "./persistence.js";
import { serializeOrder } from "./serialization.js";

const ORDER_CONSUMER = "engine-worker-order-1";
const DB_CONSUMER = "engine-worker-db-1";
const OUTBOX_POLL_MS = 250;

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
          await handleStreamFailure(
            client,
            REDIS_STREAMS.ORDER_STREAM,
            REDIS_GROUPS.ENGINE_WORKER_ORDER_GROUP,
            message.id,
            message.message,
            error,
          );
        }
      }
    }
  }
};

const startOutboxPublisher = async () => {
  while (true) {
    try {
      const events = await prisma.outboxEvent.findMany({
        where: { processedAt: null },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      for (const event of events) {
        try {
          if (event.type !== "order.created") {
            throw new Error(`Unsupported outbox event: ${event.type}`);
          }

          const payload = event.payload as {
            orderId?: number;
            userId?: number;
          };
          const orderId = payload.orderId;
          const userId = payload.userId;
          if (!Number.isInteger(orderId) || !Number.isInteger(userId)) {
            throw new Error("Order outbox payload is invalid");
          }

          await redis.xAdd(REDIS_STREAMS.ORDER_STREAM, "*", {
            event: event.type,
            orderId: String(orderId),
            userId: String(userId),
          });
          await prisma.outboxEvent.updateMany({
            where: { id: event.id, processedAt: null },
            data: { processedAt: new Date(), attempts: { increment: 1 } },
          });
        } catch (error) {
          console.error(`Outbox event ${event.id} failed:`, error);
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { attempts: { increment: 1 } },
          });
        }
      }
    } catch (error) {
      console.error("Outbox publication failed:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, OUTBOX_POLL_MS));
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
          const userId = getEventUserId(event);
          if (userId !== null) {
            await publishUserEvent(userId, "account.updated", {
              transition: event.type,
              source: "engine-worker",
            });
          }
          await client.xAck(
            REDIS_STREAMS.ENGINE_DB_STREAM,
            REDIS_GROUPS.ENGINE_DB_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("Engine DB event failed:", error);
          await handleStreamFailure(
            client,
            REDIS_STREAMS.ENGINE_DB_STREAM,
            REDIS_GROUPS.ENGINE_DB_GROUP,
            message.id,
            message.message,
            error,
          );
        }
      }
    }
  }
};

console.log("Engine worker started");

await Promise.all([
  startOutboxPublisher(),
  startOrderLoader(),
  startPersistenceConsumer(),
]);

function getEventUserId(event: EngineDbEvent) {
  if (event.type === "engine.snapshot.requested") return null;
  if (event.type === "position.opened") return event.position.userId;
  return event.userId;
}
