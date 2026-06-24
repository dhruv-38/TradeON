import { randomUUID } from "node:crypto";
import {
  parseJsonEvent,
  publishEngineCommand,
  redis,
  REDIS_STREAMS,
  type EngineCloseResponse,
  type LivePositionState,
} from "@repo/redis";
import { AppError } from "../../lib/errors/AppError.js";
import { getClosedPositions, getOpenPositions } from "./position.repository.js";

export const getPositionsService = async (userId: number) => {
  return getOpenPositions(userId);
};

export const getLivePositionsService = async (
  userId: number,
): Promise<LivePositionState> => {
  const responseStream =
    REDIS_STREAMS.ENGINE_SNAPSHOT_STREAM_PREFIX + ":live:" + randomUUID();
  const responseClient = redis.duplicate();
  await responseClient.connect();

  try {
    await publishEngineCommand({
      type: "positions.live.requested",
      userId,
      responseStream,
    });

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const response = await responseClient.xRead(
        [{ key: responseStream, id: "0" }],
        { COUNT: 1, BLOCK: 1000 },
      );
      const message = response?.[0]?.messages[0];

      if (message) {
        return parseJsonEvent<LivePositionState>(message.message.payload);
      }
    }

    throw new AppError("Live positions are temporarily unavailable", 503);
  } finally {
    await responseClient.del(responseStream);
    await responseClient.quit();
  }
};

export const closePositionService = async (
  userId: number,
  positionId: string,
) => {
  const responseStream =
    REDIS_STREAMS.ENGINE_SNAPSHOT_STREAM_PREFIX + ":close:" + randomUUID();
  const responseClient = redis.duplicate();
  await responseClient.connect();

  try {
    await publishEngineCommand({
      type: "position.close.requested",
      userId,
      positionId,
      responseStream,
    });

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const response = await responseClient.xRead(
        [{ key: responseStream, id: "0" }],
        { COUNT: 1, BLOCK: 1000 },
      );
      const message = response?.[0]?.messages[0];

      if (message) {
        const result = parseJsonEvent<EngineCloseResponse>(
          message.message.payload,
        );
        if (!result.success) {
          throw new AppError(result.error, 404);
        }
        return result.position;
      }
    }

    throw new AppError("Position close timed out", 503);
  } finally {
    await responseClient.del(responseStream);
    await responseClient.quit();
  }
};

export const getPositionHistoryService = async (userId: number) => {
  return getClosedPositions(userId);
};
