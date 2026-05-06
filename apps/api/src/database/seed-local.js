import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://webside_owner:yqPz7nSsH3YU@ep-round-glade-a1cm9zkc-pooler.ap-southeast-1.aws.neon.tech/gtexpress?sslmode=require';

async function seed() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: true
  });

  try {
    const hash = await bcrypt.hash('B7a90sfd@12', 10);
    
    const orgResult = await pool.query(
      "INSERT INTO organisations (name, slug, is_active) VALUES ('GT Express', 'gt-express', true) RETURNING id"
    );
    const orgId = orgResult.rows[0].id;
    
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified) VALUES ('Admin', 'juddan2008@gmail.com', $1, 'admin', $2, true, true)",
      [hash, orgId]
    );
    
    console.log('✅ Seeded admin user: juddan2008@gmail.com / B7a90sfd@12');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();