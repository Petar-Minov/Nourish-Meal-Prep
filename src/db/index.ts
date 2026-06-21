import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import dotenv from "dotenv";

dotenv.config({ override: true });

export const createPool = () => {
  if (process.env.DATABASE_URL) {
    console.log('Connecting to database via DATABASE_URL...');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 20,
    });
  }
  console.log('Connecting to database via individual credentials...');
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 20,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

pool.on('connect', () => {
  console.log('Database pool connected successfully');
});

pool.on('remove', () => {
  console.log('Database pool client removed');
});

export const db = drizzle(pool, { schema });

