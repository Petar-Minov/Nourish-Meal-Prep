// src/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig(
  databaseUrl
    ? {
        schema: "./src/db/schema.ts",
        out: "./src/db/drizzle",
        dialect: "postgresql",
        schemaFilter: ["public"],
        dbCredentials: {
          url: databaseUrl,
        },
        verbose: true,
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./src/db/drizzle",
        dialect: "postgresql",
        schemaFilter: ["public"],
        dbCredentials: {
          host: process.env.SQL_HOST as string,
          user: process.env.SQL_ADMIN_USER as string,
          password: process.env.SQL_ADMIN_PASSWORD as string,
          database: process.env.SQL_DB_NAME as string,
          ssl: false,
        },
        verbose: true,
      }
);
