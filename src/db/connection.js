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
    if (!databaseUrl) {
        console.error("❌ Cannot connect to DB: DATABASE_URL is missing.");
        return;
    }
    try {
        console.log("⏳ Checking database connection...");
        // Set a timeout for the connection check
        const client = await Promise.race([
            pool.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000))
        ]);
        console.log("✅ PostgreSQL database connection successful");
        client.release();
    } catch (error) {
        console.error(`❌ Failed to connect to the database: ${error.message}`);
    }
}