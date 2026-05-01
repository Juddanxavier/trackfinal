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
  console.log('Running quotes deletion migration...');

  try {
    await db.execute(`
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_reason TEXT;
    `);
    console.log('✅ quotes deletion columns ready');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }

  console.log('✅ Migration complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
