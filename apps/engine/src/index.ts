import { redis, REDIS_STREAMS, REDIS_GROUPS } from "@repo/redis";
import { executeOrder } from "./execution.engine.js";

const consumerName = "engine-1";

async function createGroup() {
  try {
    await redis.xGroupCreate( REDIS_STREAMS.ORDER_STREAM, REDIS_GROUPS.ENGINE_GROUP, "0",
        {
            MKSTREAM: true,
        });

    console.log("Consumer group created");
  } catch (err: any) {
    if (err.message.includes("BUSYGROUP")) {
      console.log("Group already exists");
    } else {
      throw err;
    }
  }
}

async function startConsumer() {
  while (true) {
    const response = await redis.xReadGroup( REDIS_GROUPS.ENGINE_GROUP, consumerName,
        [
          { key: REDIS_STREAMS.ORDER_STREAM, id: ">"},
        ],

        {
          COUNT: 10,
          BLOCK: 5000,
        }
      );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        console.log("Received Event:", message);
        try {

          await executeOrder(Number(message.message.orderId));
          console.log(`Order ${message.message.orderId} executed`);

          await redis.xAck(REDIS_STREAMS.ORDER_STREAM, REDIS_GROUPS.ENGINE_GROUP, message.id);

          console.log(`ACKED ${message.id}`);
        } catch (err) {
          console.error("Processing failed:", err);
        }
      }
    }
  }
}

await createGroup();

console.log(
  "Engine consumer started..."
);

await startConsumer();