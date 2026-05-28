import { db } from './index.js';

async function migrate() {
  console.log('[migrate] Adding archived_at to quotes...');

  try {
    await db.execute(`
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
    `);
    console.log('[migrate] Done - archived_at column added');
  } catch (err) {
    console.error('[migrate] Error:', err.message);
  }

  process.exit(0);
}

migrate();
