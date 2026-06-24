import { createClient,RedisClientType } from "redis";
import "dotenv/config"

export const redis: RedisClientType = createClient({
  url:process.env.REDIS_URL
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

await redis.connect();
console.log("Connected to Redis");