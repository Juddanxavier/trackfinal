import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function fix() {
  console.log('Dropping old refresh_token column...');
  try {
    await db.execute(
      'ALTER TABLE "sessions" DROP COLUMN IF EXISTS "refresh_token"',
    );
    console.log('Dropped old column');
  } catch (e: any) {
    console.error('Error:', e.message);
  }

  console.log('\nCurrent columns:');
  const result = await db.execute(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'sessions'
    ORDER BY ordinal_position
  `);
  result.rows.forEach((r: any) => console.log(' -', r.column_name));

  await pool.end();
  process.exit(0);
}

fix().catch((e) => {
  console.error(e);
  process.exit(1);
});
