import { db } from '../database';
import { users } from './schema/user';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function main() {
  const email = process.argv[2] || 'juddan2008@gmail.com';
  const password = process.argv[3] || 'b7a90sfd@123';

  const hash = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.email, email));

  console.log(`✅ Password updated for ${email}`);
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
