import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function migrate() {
  console.log('Running migration: 0004_security_updates.sql');

  const sql = readFileSync(
    join(__dirname, '../../drizzle/0004_security_updates.sql'),
    'utf8',
  );

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      try {
        await db.execute(statement);
        console.log('  ✅ Success');
      } catch (err: any) {
        if (
          err.code === '42703' ||
          err.code === '23505' ||
          err.code === '23502'
        ) {
          console.log(
            `  ⚠️  Skipped (${err.code}): ${err.message.substring(0, 100)}`,
          );
        } else {
          console.error(`  ❌ Error: ${err.message}`);
        }
      }
    }
  }

  console.log('✅ Migration complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
