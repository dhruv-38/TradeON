import { redis } from "./client.js";
import { REDIS_STREAMS } from "./streams.js";
import { xAddWithMaxLen } from "./capped-stream.js";

export const publishUserEvent = async (
  userId: number,
  event: string,
  payload: Record<string, string>,
) => {
  await xAddWithMaxLen(redis, REDIS_STREAMS.USER_EVENTS_STREAM, "*", {
    userId: String(userId),
    event,
    ...payload,
  });
};
