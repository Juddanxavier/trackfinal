import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Migrating organisations → organisations + branches...');

  // 1. Create branches table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country_code TEXT DEFAULT 'US',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    console.log('✅ Created branches table');
  } catch (e) { console.error('Step 1 failed:', e.message); throw e; }

  // 2. Copy existing branches from organisations to branches
  try {
    const copyResult = await pool.query(`
      INSERT INTO branches (organisation_id, name, city, country_code, is_active, created_at, updated_at)
      SELECT parent_id, name, city, country_code, is_active, created_at, updated_at
      FROM organisations
      WHERE is_branch = true AND parent_id IS NOT NULL
    `);
    console.log(`✅ Copied ${copyResult.rowCount} branches to branches table`);
  } catch (e) { console.error('Step 2 failed:', e.message); throw e; }

  // 3. Null out branch_id on users where the branch wasn't copied
  try {
    await pool.query(`
      UPDATE users SET branch_id = NULL
      WHERE branch_id IS NOT NULL
        AND branch_id NOT IN (SELECT id FROM branches)
    `);
    console.log('✅ Cleared orphan user branch_id references');
  } catch (e) { console.error('Step 3 failed:', e.message); throw e; }

  // 4. Update users.branch_id FK to point to branches
  try {
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_branch_id_fkey`);
    await pool.query(`ALTER TABLE users ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id)`);
    console.log('✅ Updated users.branch_id FK');
  } catch (e) { console.error('Step 4 failed:', e.message); throw e; }

  // 5. Update invitation_statuses.branch_id FK to point to branches
  try {
    await pool.query(`
      UPDATE invitation_statuses SET branch_id = NULL
      WHERE branch_id IS NOT NULL
        AND branch_id NOT IN (SELECT id FROM branches)
    `);
    await pool.query(`ALTER TABLE invitation_statuses DROP CONSTRAINT IF EXISTS invitation_statuses_branch_id_fkey`);
    await pool.query(`ALTER TABLE invitation_statuses ADD CONSTRAINT invitation_statuses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id)`);
    console.log('✅ Updated invitation_statuses.branch_id FK');
  } catch (e) { console.error('Step 5 failed:', e.message); throw e; }

  // 6. Add branch_id to quotes (optional column)
  try {
    await pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id)`);
    console.log('✅ Added quotes.branch_id');
  } catch (e) { console.error('Step 6 failed:', e.message); throw e; }

  // 7. Drop old columns from organisations
  try {
    await pool.query(`ALTER TABLE organisations DROP COLUMN IF EXISTS is_branch`);
    await pool.query(`ALTER TABLE organisations DROP COLUMN IF EXISTS parent_id`);
    console.log('✅ Dropped old is_branch/parent_id columns from organisations');
  } catch (e) { console.error('Step 7 failed:', e.message); throw e; }

  // 8. Create index on branches.organisation_id
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_branches_organisation_id ON branches(organisation_id)`);
    console.log('✅ Created index on branches.organisation_id');
  } catch (e) { console.error('Step 8 failed:', e.message); throw e; }

  console.log('✅ Migration complete');
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    pool.end();
    process.exit(1);
  });
