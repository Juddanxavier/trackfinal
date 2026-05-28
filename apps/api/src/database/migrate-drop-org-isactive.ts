import { db } from './index';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Dropping is_active from organisations...');

  try {
    await db.execute(sql`ALTER TABLE organisations DROP COLUMN IF EXISTS is_active`);
    console.log('✅ Dropped is_active column from organisations');
  } catch (err: unknown) {
    console.error('❌ Failed to drop is_active:', (err as Error).message);
    process.exit(1);
  }

  console.log('✅ Migration complete');
}

migrate().catch(console.error);
