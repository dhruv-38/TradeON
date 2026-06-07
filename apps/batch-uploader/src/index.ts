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

async function flush() {
    if (buffer.length === 0) {
        return;
    }

    const values = buffer.map((tick) => `('${tick.time.toISOString()}', '${tick.symbol}', ${tick.bid},${tick.ask})`).join(",");

    await timescale.query(`INSERT INTO ticks (time,symbol,bid,ask) VALUES ${values}`);

    await redis.xAck(
        REDIS_STREAMS.MARKET_TICKS_STREAM,
        REDIS_GROUPS.BATCH_GROUP,
        pendingIds
    );

    console.log(`Inserted ${buffer.length} ticks`);

    buffer.length = 0;
}


setInterval(flush, FLUSH_INTERVAL);


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
