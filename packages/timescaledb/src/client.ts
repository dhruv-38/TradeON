import { Pool } from "pg";
import {config} from "@repo/config"

export const timescale = new Pool({
  connectionString:config.TIMESCALE_DATABASE_URL,

  // Pool sizing - adjust based on your workload
  max: 20,                    // Maximum connections in pool
  min: 5,                     // Minimum connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Timeout for new connections
});

// // Monitor pool events for debugging
// timescale.on('connect', () => {
//   console.log('New client connected to TimescaleDB');
// });

// timescale.on('error', (err) => {
//   console.error('Unexpected pool error:', err);
// });

// // Helper function for single queries
// async function query(text, params) {
//   const start = Date.now();
//   const result = await pool.query(text, params);
//   const duration = Date.now() - start;

//   // Log slow queries for optimization
//   if (duration > 100) {
//     console.log('Slow query:', { text, duration, rows: result.rowCount });
//   }

//   return result;
// }

// // Helper for transactions
// async function withTransaction(callback) {
//   const client = await timescale.connect();
//   try {
//     await client.query('BEGIN');
//     const result = await callback(client);
//     await client.query('COMMIT');
//     return result;
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// }


// export {timescale,query,withTransaction};
