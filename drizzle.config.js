import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve('config', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in config/.env file');
}

export default defineConfig({
  schema: "./src/db/models/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  }
});
