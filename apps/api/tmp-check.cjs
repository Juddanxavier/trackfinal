require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("SELECT email, role, is_active, email_verified, LEFT(password_hash, 20) as pw_prefix FROM users WHERE email = 'juddan2008@gmail.com'");
  console.log(JSON.stringify(r.rows[0], null, 2));
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
