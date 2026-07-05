import type { RedisClientType } from "redis";
import { REDIS_STREAMS } from "./streams.js";
import { xAddWithMaxLen } from "./capped-stream.js";

const MAX_DELIVERIES = 3;

export async function handleStreamFailure(
  client: RedisClientType,
  stream: string,
  group: string,
  messageId: string,
  message: Record<string, string>,
  error: unknown,
) {
  const pending = await client.xPendingRange(
    stream,
    group,
    messageId,
    messageId,
    1,
  );
  const deliveries = pending[0]?.deliveriesCounter ?? 1;

  if (deliveries < MAX_DELIVERIES) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return;
  }

  await xAddWithMaxLen(client, REDIS_STREAMS.ENGINE_DLQ_STREAM, "*", {
    sourceStream: stream,
    sourceGroup: group,
    sourceId: messageId,
    message: JSON.stringify(message),
    error: error instanceof Error ? error.message : String(error),
    failedAt: new Date().toISOString(),
  });
  await client.xAck(stream, group, messageId);
}
