import { redis } from "./client.js";
import { REDIS_STREAM_MAXLEN } from "./streams.js";

type XAddClient = Pick<typeof redis, "xAdd">;

export const xAddWithMaxLen = (
  client: XAddClient,
  stream: string,
  id: string,
  message: Record<string, string>,
) => {
  const threshold =
    REDIS_STREAM_MAXLEN[stream as keyof typeof REDIS_STREAM_MAXLEN];

  if (!threshold) {
    return client.xAdd(stream, id, message);
  }

  return client.xAdd(stream, id, message, {
    TRIM: {
      strategy: "MAXLEN",
      strategyModifier: "~",
      threshold,
    },
  });
};
