import { db } from '../database';
import { carriers } from '../database/schema/carriers';
import * as fs from 'fs';
import * as path from 'path';

async function migrateCarriers() {
  console.log('Creating carriers table...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS carriers (
      key VARCHAR(20) PRIMARY KEY,
      name_en VARCHAR(255) NOT NULL,
      name_cn VARCHAR(255),
      name_hk VARCHAR(255),
      url VARCHAR(500)
    )
  `);

  console.log('Carriers table created');

  console.log('Loading carriers from CSV...');
  const csvPath = path.join(__dirname, '..', '..', 'carriers.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1);

  let inserted = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [key, name_en, name_cn, name_hk, url] = trimmed.split(',');
    if (key && name_en) {
      await db
        .insert(carriers)
        .values({
          key,
          nameEn: name_en,
          nameCn: name_cn || null,
          nameHk: name_hk || null,
          url: url || null,
        })
        .onConflictDoNothing({
          target: carriers.key,
        });
      inserted++;
    }
  }

  console.log(`Inserted ${inserted} carriers`);
}

migrateCarriers()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
