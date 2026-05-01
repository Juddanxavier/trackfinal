import { sql } from 'drizzle-orm';
import { db } from './index';

async function migrate() {
  await db.execute(
    sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`,
  );
  console.log('Added archived_at column to quotes');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
