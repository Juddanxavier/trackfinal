import 'reflect-metadata';
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('organisations', 'users', 'sessions')
  `);
  console.log(
    '✅ Tables in database:',
    result.rows.map((r) => r.table_name),
  );

  // Also check columns for users
  const columns = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public'
  `);
  console.log(
    '✅ Users columns:',
    columns.rows.map((c) => c.column_name),
  );

  await pool.end();
}

check();
