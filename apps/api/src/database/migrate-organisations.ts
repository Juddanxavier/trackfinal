import { db } from './index';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Migrating organisations table...');

  const alterations = [
    'ADD COLUMN IF NOT EXISTS email TEXT',
    'ADD COLUMN IF NOT EXISTS phone TEXT',
    'ADD COLUMN IF NOT EXISTS address TEXT',
    'ADD COLUMN IF NOT EXISTS city TEXT',
    'ADD COLUMN IF NOT EXISTS state TEXT',
    'ADD COLUMN IF NOT EXISTS postal_code TEXT',
    "ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'US'",
    "ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'",
    'ADD COLUMN IF NOT EXISTS logo_url TEXT',
  ];

  for (const alter of alterations) {
    try {
      await db.execute(sql`ALTER TABLE organisations ${sql.raw(alter)}`);
      console.log(`✅ ${alter}`);
    } catch (err: unknown) {
      if ((err as Error).message?.includes('does not exist')) {
        console.log(`ℹ️  Column already exists: ${alter.split(' ')[2]}`);
      } else {
        console.error(`❌ ${alter}:`, (err as Error).message);
      }
    }
  }

  console.log('✅ Migration complete');
}

migrate().catch(console.error);
