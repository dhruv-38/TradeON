import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

// Try to load .env file if it exists (for local development)
// In Docker, environment variables are set via docker-compose, so this is optional
const envPath = path.resolve(__dirname, "../../../../.env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false }); // override: false means don't overwrite existing env vars
} else {
  // In Docker or if .env doesn't exist, rely on process.env (set by Docker)
  dotenv.config({ override: false });
}

const envSchema = z.object({
  DATABASE_URL: z.string(),
});

const env = envSchema.parse(process.env);

export const config ={
    DATABASE_URL :env.DATABASE_URL,
};

export default config;