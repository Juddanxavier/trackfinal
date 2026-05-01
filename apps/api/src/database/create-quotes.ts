import 'reflect-metadata';
import 'dotenv/config';
import { db } from '../database';

async function migrate() {
  console.log('Creating quotes table...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL,
      user_id UUID NOT NULL,
      assigned_to_id UUID,
      origin_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      goods_type TEXT NOT NULL DEFAULT 'general',
      weight NUMERIC(10,2) NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      remarks TEXT,
      price NUMERIC(10,2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  console.log('✅ Quotes table created!');

  // Add foreign key constraints
  await db
    .execute(
      `
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id)
  `,
    )
    .catch(() => {}); // Ignore if already exists

  await db
    .execute(
      `
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
  `,
    )
    .catch(() => {});

  console.log('✅ Foreign keys added!');

  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
