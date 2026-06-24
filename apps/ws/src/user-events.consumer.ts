import {
  handleStreamFailure,
  redis,
  REDIS_GROUPS,
  REDIS_STREAMS,
} from "@repo/redis";
import { WebSocket } from "ws";

const CONSUMER = "ws-server-1";

export const startUserEventsConsumer = async (
  userSockets: Map<number, Set<WebSocket>>,
) => {
  const client = redis.duplicate();
  await client.connect();

  try {
    await client.xGroupCreate(
      REDIS_STREAMS.USER_EVENTS_STREAM,
      REDIS_GROUPS.WS_GROUP,
      "0",
      { MKSTREAM: true },
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }

  while (true) {
    const pending = await client.xReadGroup(
      REDIS_GROUPS.WS_GROUP,
      CONSUMER,
      [{ key: REDIS_STREAMS.USER_EVENTS_STREAM, id: "0" }],
      { COUNT: 100 },
    );
    const response = pending?.[0]?.messages.length
      ? pending
      : await client.xReadGroup(
          REDIS_GROUPS.WS_GROUP,
          CONSUMER,
          [{ key: REDIS_STREAMS.USER_EVENTS_STREAM, id: ">" }],
          { COUNT: 100, BLOCK: 5000 },
        );

    if (!response) continue;

    for (const stream of response) {
      for (const message of stream.messages) {
        try {
          const userId = Number(message.message.userId);
          if (!Number.isInteger(userId)) {
            throw new Error("User event has an invalid userId");
          }

          const payload = JSON.stringify({
            ...message.message,
            userId,
          });
          const sockets = userSockets.get(userId);
          if (sockets) {
            for (const socket of sockets) {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(payload);
              }
            }
          }

          await client.xAck(
            REDIS_STREAMS.USER_EVENTS_STREAM,
            REDIS_GROUPS.WS_GROUP,
            message.id,
          );
        } catch (error) {
          console.error("User event delivery failed:", error);
          await handleStreamFailure(
            client,
            REDIS_STREAMS.USER_EVENTS_STREAM,
            REDIS_GROUPS.WS_GROUP,
            message.id,
            message.message,
            error,
          );
        }
      }
    }
  }
};
