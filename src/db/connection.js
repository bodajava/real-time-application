import path from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

dotenv.config({ path: path.resolve('config', '.env') });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
  console.warn('⚠️ WARNING: DATABASE_URL is not defined in config/.env');
}

export const pool = new Pool({
  connectionString: databaseUrl,
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