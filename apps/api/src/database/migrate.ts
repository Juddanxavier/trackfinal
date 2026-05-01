import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function migrate() {
  console.log('Running migrations...');

  // Migrate notifications table if it doesn't exist
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title_key TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('notifications table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('notifications table already exists');
    } else {
      throw err;
    }
  }

  // Migrate tracking_trans_log table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_trans_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tracking_number TEXT NOT NULL,
        carrier_code TEXT NOT NULL,
        retrans_attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB
      );
    `);
    console.log('tracking_trans_log table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('tracking_trans_log table already exists');
    } else {
      throw err;
    }
  }

  console.log('All migrations complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
