import { redis, REDIS_STREAMS, REDIS_GROUPS } from "@repo/redis";
import { WebSocket } from "ws";

const consumerName = "ws-server-1";

export const startUserEventsConsumer = async (userSockets: Map<number, Set<WebSocket>>) => {
    try {
        await redis.xGroupCreate(REDIS_STREAMS.USER_EVENTS_STREAM, REDIS_GROUPS.WS_GROUP, "0",
            {
                MKSTREAM: true,
            }
        );

        console.log("WS group created");

    } catch (err: any) {

        if (err.message.includes("BUSYGROUP")) {
            console.log("WS group exists");
        } else {
            throw err;
        }
    }

    while (true) {

        const response = await redis.xReadGroup(REDIS_GROUPS.WS_GROUP, consumerName,
            [
                {
                    key:
                        REDIS_STREAMS.USER_EVENTS_STREAM,
                    id: ">",
                },
            ],
            {
                COUNT: 100,
                BLOCK: 5000,
            }
        );

        if (!response) {
            continue;
        }

        for (const stream of response) {
            for (const message of stream.messages) {
                const userId = Number(message.message.userId);
                const sockets = userSockets.get(userId);

                if (sockets) {
                    const payload = {
                        event: message.message.event,
                        userId,
                        ...message.message,
                    };

                    for (const socket of sockets) {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify(payload));
                        }
                    }
                }

                await redis.xAck(REDIS_STREAMS.USER_EVENTS_STREAM, REDIS_GROUPS.WS_GROUP, message.id);
            }
        }
    }
};