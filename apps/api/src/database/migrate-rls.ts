import { db } from './index';
import { sql } from 'drizzle-orm';

const TABLES = [
  'shipments',
  'quotes',
  'users',
  'branches',
  'invitations',
  'notifications',
];

async function migrate() {
  console.log('Enabling Row-Level Security...');

  for (const table of TABLES) {
    try {
      await db.execute(sql`ALTER TABLE ${sql.identifier(table as any)} ENABLE ROW LEVEL SECURITY`);
      console.log(`✅ RLS enabled on ${table}`);
    } catch (err: unknown) {
      console.error(`❌ Failed to enable RLS on ${table}:`, (err as Error).message);
      process.exit(1);
    }
  }

  // Policies for tables with organisation_id
  const orgScopedTables = [
    'shipments',
    'quotes',
    'users',
    'branches',
    'invitations',
    'notifications',
  ];

  for (const table of orgScopedTables) {
    try {
      // Drop existing policy if any
      await db.execute(sql`DROP POLICY IF EXISTS org_isolation ON ${sql.identifier(table as any)}`);
      await db.execute(sql`
        CREATE POLICY org_isolation ON ${sql.identifier(table as any)}
        FOR ALL
        USING (organisation_id = current_setting('app.organisation_id', true)::uuid)
        WITH CHECK (organisation_id = current_setting('app.organisation_id', true)::uuid)
      `);
      console.log(`✅ Org isolation policy created on ${table}`);
    } catch (err: unknown) {
      console.error(`❌ Failed to create policy on ${table}:`, (err as Error).message);
      process.exit(1);
    }
  }

  // Branches has organisationId as FK — same policy
  try {
    await db.execute(sql`DROP POLICY IF EXISTS org_isolation ON branches`);
    await db.execute(sql`
      CREATE POLICY org_isolation ON branches
      FOR ALL
      USING (organisation_id = current_setting('app.organisation_id', true)::uuid)
      WITH CHECK (organisation_id = current_setting('app.organisation_id', true)::uuid)
    `);
    console.log('✅ Org isolation policy on branches');
  } catch (err: unknown) {
    console.error('❌ Failed on branches:', (err as Error).message);
    process.exit(1);
  }

  // Organisations table — users can only see their own org
  try {
    await db.execute(sql`ALTER TABLE organisations ENABLE ROW LEVEL SECURITY`);
    await db.execute(sql`DROP POLICY IF EXISTS org_isolation ON organisations`);
    await db.execute(sql`
      CREATE POLICY org_isolation ON organisations
      FOR ALL
      USING (id = current_setting('app.organisation_id', true)::uuid)
      WITH CHECK (id = current_setting('app.organisation_id', true)::uuid)
    `);
    console.log('✅ Org isolation policy on organisations');
  } catch (err: unknown) {
    console.error('❌ Failed on organisations:', (err as Error).message);
    process.exit(1);
  }

  console.log('✅ RLS migration complete');
  console.log('');
  console.log('⚠️  IMPORTANT: You MUST set app.organisation_id at the start of each request.');
  console.log('   Add this to your NestJS middleware or interceptor:');
  console.log('   await db.execute(sql`SELECT set_config(\'app.organisation_id\', $1, true)`, [orgId]);');
  console.log('   The third arg "true" makes it local to the current transaction.');
}

migrate().catch(console.error);
