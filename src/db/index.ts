import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import dotenv from "dotenv";

dotenv.config({ override: true });

export const createPool = () => {
  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 20,
      }
    : {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 20,
      };

  const newPool = new Pool(poolConfig);

  newPool.on('connect', (client) => {
    console.log('Database pool: New client connected');
  });

  newPool.on('error', (err, client) => {
    console.error('Database pool: Unexpected error on idle client:', err);
  });

  newPool.on('remove', (client) => {
    console.log('Database pool: Client removed from pool');
  });

  return newPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
