import { redis, REDIS_STREAMS, REDIS_GROUPS } from "@repo/redis";
import { timescale } from "@repo/timescaledb";

const consumerName = "batch-uploader-1";
const BATCH_SIZE = 1000;
const FLUSH_INTERVAL = 5000;

async function createGroup() {
    try {
        await redis.xGroupCreate(REDIS_STREAMS.MARKET_TICKS_STREAM, REDIS_GROUPS.BATCH_GROUP, "0",
            {
                MKSTREAM: true,
            }
        );

        console.log("Batch group created");

    } catch (err: any) {

        if (err.message.includes("BUSYGROUP")) {
            console.log("Batch group exists");
        } else {
            throw err;
        }
    }
}

const pendingIds: string[] = [];
const buffer: {
    time: Date;
    symbol: string;
    bid: number;
    ask: number;
}[] = [];

let currentFlush: Promise<void> | null = null;

async function flushBatch() {
    if (buffer.length === 0) {
        return;
    }

    const batch = buffer.slice();
    const idsToAck = pendingIds.slice(0, batch.length);

    const values = batch.map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(",");

    const params = batch.flatMap((tick) => [tick.time, tick.symbol, tick.bid, tick.ask]);

    await timescale.query(`INSERT INTO ticks (time,symbol,bid,ask) VALUES ${values}`, params);

    await redis.xAck(
        REDIS_STREAMS.MARKET_TICKS_STREAM,
        REDIS_GROUPS.BATCH_GROUP,
        idsToAck
    );

    buffer.splice(0, batch.length);
    pendingIds.splice(0, idsToAck.length);

    console.log(`Inserted ${batch.length} ticks`);
}

async function flush() {
    if (!currentFlush) {
        currentFlush = flushBatch().finally(() => {
            currentFlush = null;
        });
    }

    return currentFlush;
}


setInterval(() => {
    void flush().catch((error) => {
        console.error("Failed to flush ticks", error);
    });
}, FLUSH_INTERVAL);


async function startConsumer() {
    while (true) {
        const response = await redis.xReadGroup(REDIS_GROUPS.BATCH_GROUP, consumerName,
            [
                {
                    key: REDIS_STREAMS.MARKET_TICKS_STREAM,
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
                buffer.push({
                    time: new Date(Number(message.message.timestamp)),
                    symbol: String(message.message.symbol),
                    bid: Number(message.message.bid),
                    ask: Number(message.message.ask),
                });
                pendingIds.push(message.id);

                if (buffer.length >= BATCH_SIZE) {
                    await flush();
                }
            }
        }
    }
}

process.on("SIGINT", async () => {
    console.log("Flushing remaining ticks...");
    await flush();
    process.exit(0);
});

await createGroup();

console.log("Batch uploader started...");


await startConsumer();
