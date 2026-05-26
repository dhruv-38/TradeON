import { createClient,RedisClientType } from "redis";

export const redis: RedisClientType = createClient();

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

await redis.connect();
console.log("Connected to Redis");