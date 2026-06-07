// import {query,withTransaction} from "./client.js"
// async function createSchema() {
//   await withTransaction(async (client) => {
//     // Enable TimescaleDB extension
//     await client.query(`
//       CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
//     `);

//     // Create the base table for sensor readings
//     // Note: We use TIMESTAMPTZ for proper timezone handling
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS sensor_readings (
//         time        TIMESTAMPTZ NOT NULL,
//         sensor_id   TEXT NOT NULL,
//         location    TEXT,
//         temperature DOUBLE PRECISION,
//         humidity    DOUBLE PRECISION,
//         pressure    DOUBLE PRECISION,
//         battery     DOUBLE PRECISION,
//         metadata    JSONB DEFAULT '{}'::jsonb
//       );
//     `);

//     // Convert to hypertable with 1-day chunks
//     // chunk_time_interval determines partition size
//     await client.query(`
//       SELECT create_hypertable(
//         'sensor_readings',
//         'time',
//         chunk_time_interval => INTERVAL '1 day',
//         if_not_exists => TRUE
//       );
//     `);

//     // Create indexes for common query patterns
//     // Compound index on sensor_id and time speeds up device-specific queries
//     await client.query(`
//       CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time
//       ON sensor_readings (sensor_id, time DESC);
//     `);

//     // Index for location-based queries
//     await client.query(`
//       CREATE INDEX IF NOT EXISTS idx_sensor_readings_location
//       ON sensor_readings (location, time DESC);
//     `);

//     console.log('Schema created successfully');
//   });
// }

// // Create table for device metadata
// async function createDeviceTable() {
//   await query(`
//     CREATE TABLE IF NOT EXISTS devices (
//       sensor_id   TEXT PRIMARY KEY,
//       name        TEXT NOT NULL,
//       location    TEXT,
//       device_type TEXT,
//       installed   TIMESTAMPTZ DEFAULT NOW(),
//       active      BOOLEAN DEFAULT TRUE,
//       config      JSONB DEFAULT '{}'::jsonb
//     );
//   `);
// }

// module.exports = { createSchema, createDeviceTable };