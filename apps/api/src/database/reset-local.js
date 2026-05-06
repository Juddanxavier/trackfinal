import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://webside_owner:yqPz7nSsH3YU@ep-round-glade-a1cm9zkc-pooler.ap-southeast-1.aws.neon.tech/gtexpress?sslmode=require',
  ssl: true
});

async function reset() {
  await pool.query("DELETE FROM users WHERE email='juddan2008@gmail.com'");
  await pool.query("DELETE FROM organisations WHERE slug='gt-express'");
  
  const hash = await bcrypt.hash('B7a90sfd@12', 10);
  const org = await pool.query("INSERT INTO organisations (name, slug, is_active) VALUES ('GT Express', 'gt-express', true) RETURNING id");
  
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified) VALUES ('Admin', 'juddan2008@gmail.com', $1, 'admin', $2, true, true)",
    [hash, org.rows[0].id]
  );
  
  console.log('✅ Reset done!');
  await pool.end();
}

reset();