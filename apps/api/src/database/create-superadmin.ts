import { db } from '../database';
import { users } from './schema/user';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: pnpm create-superadmin <email> <password>

Example:
  pnpm create-superadmin super@track.com mypassword123
`);
    process.exit(1);
  }

  const [email, password] = args;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log(`⚠️  User "${email}" already exists`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name: 'Super Admin',
    email,
    passwordHash: hash,
    role: 'superadmin',
    isActive: true,
    emailVerified: true,
  });

  console.log(`✅ Superadmin created: ${email} / ${password}`);
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
