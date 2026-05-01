import 'reflect-metadata';
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function createDatabase() {
  // Connect to default postgres database to create new database
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.replace('/', '');
  const defaultUrl = process.env.DATABASE_URL!.replace(
    `/${dbName}`,
    '/postgres',
  );

  console.log('Connecting to:', defaultUrl);

  const pool = new Pool({
    connectionString: defaultUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check if database exists
    const result = await pool.query(
      `
      SELECT 1 FROM pg_database WHERE datname = $1
    `,
      [dbName],
    );

    if (result.rows.length === 0) {
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`✅ Database already exists: ${dbName}`);
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

createDatabase();
