import { db } from '../database';
import { organisations } from './schema/organisations';
import { users } from './schema/user';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Usage: pnpm create-org <name> <slug> <admin-email>

Example:
  pnpm create-org "Acme Corp" acme-corp admin@acme.com
`);
    process.exit(1);
  }

  const [name, slug, adminEmail] = args;
  const password = generatePassword();

  const existingOrg = await db.query.organisations.findFirst({
    where: eq(organisations.slug, slug),
  });

  if (existingOrg) {
    console.log(`⚠️  Organisation "${name}" (${slug}) already exists`);
    process.exit(0);
  }

  const [org] = await db
    .insert(organisations)
    .values({ name, slug })
    .returning();

  console.log(`✅ Organisation "${name}" created`);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (existingUser) {
    await db
      .update(users)
      .set({ organisationId: org.id, role: 'admin' })
      .where(eq(users.id, existingUser.id));

    console.log(`✅ Existing user "${adminEmail}" assigned as admin`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name: 'Admin User',
    email: adminEmail,
    passwordHash: hash,
    role: 'admin',
    organisationId: org.id,
    isActive: true,
    emailVerified: true,
  });

  console.log(`✅ Admin created: ${adminEmail} / ${password}`);
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
