import { sql } from 'drizzle-orm';
import { db } from './index';

async function migrate() {
  await db.execute(sql`
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_on_update JSONB DEFAULT '{"email":true,"sms":false}';
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_email TEXT;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_phone TEXT;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS bill_amount NUMERIC(10,2);
  `);
  console.log('Added notification, archive, deleted, and bill_amount columns');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
