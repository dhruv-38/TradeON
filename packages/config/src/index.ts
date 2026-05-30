import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load ROOT .env
dotenv.config({path: path.resolve(process.cwd(), "../../.env")});

const EnvSchema = z.object({
  DATABASE_URL: z.string(),

  JWT_SECRET: z.string(),

  REDIS_URL: z.string(),

  NODE_ENV: z.string(),

  BACKPACK_WS_URL: z.string()
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error( "Invalid environment variables:");

  console.error( parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const config = parsedEnv.data;
