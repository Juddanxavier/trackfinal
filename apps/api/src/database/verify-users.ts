import { db } from '../database/index';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`UPDATE users SET email_verified = true`);
  console.log('Updated all users to verified email');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
