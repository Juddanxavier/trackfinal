require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("SELECT password_hash FROM users WHERE email = 'juddan2008@gmail.com'");
  const hash = r.rows[0].password_hash;
  const match = await bcrypt.compare('b7a90sfd@123', hash);
  console.log('Password match:', match);
  // If not matched, re-hash and update
  if (!match) {
    const newHash = await bcrypt.hash('b7a90sfd@123', 10);
    await c.query("UPDATE users SET password_hash = $1 WHERE email = 'juddan2008@gmail.com'", [newHash]);
    console.log('Password re-hashed and updated');
  }
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
