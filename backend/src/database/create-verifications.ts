import 'reflect-metadata';
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function createVerificationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS "verifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" text NOT NULL UNIQUE,
        "type" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used_at" timestamp,
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ Verifications table created');

    await client.release();
  } catch (err: any) {
    console.log('ℹ️', err.message);
  } finally {
    await pool.end();
  }
}

createVerificationsTable();
