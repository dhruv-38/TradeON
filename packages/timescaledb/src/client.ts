import { Pool } from "pg";
import {config} from "@repo/config"

export const timescale = new Pool({
  connectionString:config.TIMESCALE_DATABASE_URL,
});
