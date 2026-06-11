const bcrypt = require('bcrypt');
(async () => {
  const hash = await bcrypt.hash('b7a90sfd@123', 10);
  console.log(hash);
})().catch(e => { console.error(e); process.exit(1); });
