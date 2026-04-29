import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function migrate() {
  console.log('Running tracking migrations...');

  try {
    await db.execute(`
      CREATE TYPE tracking_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');
    `);
    console.log('✅ tracking_job_status enum ready');
  } catch (err: any) {
    if (err.code === '42710') {
      console.log('ℹ️ tracking_job_status enum already exists');
    } else {
      console.log('ℹ️ enum may already exist:', err.message);
    }
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID,
        tracking_number TEXT NOT NULL,
        carrier_code TEXT NOT NULL,
        status tracking_job_status NOT NULL DEFAULT 'pending',
        operation TEXT NOT NULL DEFAULT 'gettrackinfo',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        last_attempt_at TIMESTAMP,
        next_attempt_at TIMESTAMP,
        last_error TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    console.log('✅ tracking_jobs table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ tracking_jobs table already exists');
    } else {
      console.log('⚠️ tracking_jobs:', err.message);
    }
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_job_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES tracking_jobs(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        error TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ tracking_job_events table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ tracking_job_events table already exists');
    } else {
      console.log('⚠️ tracking_job_events:', err.message);
    }
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_api_rate_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMP NOT NULL DEFAULT NOW(),
        window_end TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(api_key, endpoint)
      );
    `);
    console.log('✅ tracking_api_rate_limits table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ tracking_api_rate_limits table already exists');
    } else {
      console.log('⚠️ tracking_api_rate_limits:', err.message);
    }
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tracking_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID,
        webhook_enabled BOOLEAN NOT NULL DEFAULT true,
        polling_enabled BOOLEAN NOT NULL DEFAULT true,
        polling_interval_minutes INTEGER NOT NULL DEFAULT 60,
        retry_attempts INTEGER NOT NULL DEFAULT 3,
        retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ tracking_settings table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ tracking_settings table already exists');
    } else {
      console.log('⚠️ tracking_settings:', err.message);
    }
  }

  try {
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_tracking_jobs_status ON tracking_jobs(status);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_tracking_jobs_next_attempt ON tracking_jobs(next_attempt_at) WHERE next_attempt_at IS NOT NULL;
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_tracking_jobs_priority ON tracking_jobs(priority DESC);
    `);
    console.log('✅ tracking_jobs indexes ready');
  } catch (err: any) {
    console.log('⚠️ indexes:', err.message);
  }

  console.log('✅ All tracking migrations complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
