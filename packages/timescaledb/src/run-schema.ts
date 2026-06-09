import { createSchema } from "./schema.js";
import { timescale } from "./client.js";

async function main() {
  try {
    await createSchema();
  } finally {
    await timescale.end();
  }
}

main().catch((error) => {
  console.error("Failed to create TimescaleDB schema:", error);
  process.exit(1);
});
