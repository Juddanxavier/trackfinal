import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function migrate() {
  console.log('Running migration: 0004_security_updates.sql\n');

  const statements = [
    `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_hash" text`,
    `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_version" integer NOT NULL DEFAULT 1`,
    `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp`,
    `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_agent" text`,
    `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ip_address" text`,
    `DROP INDEX IF EXISTS "idx_sessions_token_hash"`,
    `CREATE INDEX "idx_sessions_token_hash" ON "sessions"("refresh_token_hash") WHERE "revoked_at" IS NULL`,
    `DROP INDEX IF EXISTS "idx_sessions_expires_at"`,
    `CREATE INDEX "idx_sessions_expires_at" ON "sessions"("expires_at")`,
  ];

  for (const sql of statements) {
    console.log(`Executing: ${sql}`);
    try {
      await db.execute(sql);
      console.log('  ✅ Success\n');
    } catch (err: any) {
      console.log(`  ⚠️  ${err.code || 'error'}: ${err.message}\n`);
    }
  }

  console.log('\nChecking columns...');
  try {
    const result = await db.execute(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `);
    console.log('Current sessions columns:');
    result.rows.forEach((r: any) =>
      console.log(`  - ${r.column_name} (${r.data_type})`),
    );
  } catch (e: any) {
    console.error('Check failed:', e.message);
  }

  console.log('\n✅ Migration check complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
