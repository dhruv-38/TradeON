import { redis } from "./client.js";
import { REDIS_STREAMS } from "./streams.js";

export const publishUserEvent = async (userId: number,event: string, payload: Record<string, string>) => {
    await redis.xAdd(REDIS_STREAMS.USER_EVENTS_STREAM,"*",
        {
            userId: String(userId),
            event,
            ...payload,
        }
    );
};