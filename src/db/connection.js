import path from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

dotenv.config({ path: path.resolve('config', '.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in config/.env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log("PostgreSQL database connection successful");
        client.release();
    } catch (error) {
        console.log(`Failed to connect to the database: ${error}`);
    }
}