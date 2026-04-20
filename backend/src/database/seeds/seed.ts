import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { db } from '../../database';
import { users, organisations, sessions } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';

async function seed() {
  console.log('🌱 Starting seed...');

  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@track.com'));
  if (existingAdmin.length > 0) {
    console.log('✅ Admin user already exists, continuing to add orgs...');
  }

  // Create default organisation if not exists
  const existingOrg = await db.select().from(organisations).where(eq(organisations.slug, 'track-hq'));
  let org = existingOrg[0];
  if (!org) {
    const [newOrg] = await db.insert(organisations).values({
      name: 'Track HQ',
      slug: 'track-hq',
      isActive: true,
    }).returning();
    org = newOrg;
  }
  console.log('✅ Organisation:', org.name);

  // Create admin user if not exists
  const existingAdminUser = await db.select().from(users).where(eq(users.email, 'admin@track.com'));
  if (existingAdminUser.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      email: 'admin@track.com',
      passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
      organisationId: org.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Admin user: admin@track.com');

  // Create staff user if not exists
  const existingStaffUser = await db.select().from(users).where(eq(users.email, 'staff@track.com'));
  if (existingStaffUser.length === 0) {
    await db.insert(users).values({
      email: 'staff@track.com',
      passwordHash: await bcrypt.hash('staff123', 10),
      name: 'Staff User',
      role: Role.STAFF,
      organisationId: org.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Staff user: staff@track.com');

  // Create customer user if not exists
  const existingCustomerUser = await db.select().from(users).where(eq(users.email, 'customer@track.com'));
  if (existingCustomerUser.length === 0) {
    await db.insert(users).values({
      email: 'customer@track.com',
      passwordHash: await bcrypt.hash('customer123', 10),
      name: 'Customer User',
      role: Role.CUSTOMER,
      organisationId: org.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Customer user: customer@track.com');

  // Create India organisation if not exists
  const existingIndia = await db.select().from(organisations).where(eq(organisations.slug, 'india'));
  let india = existingIndia[0];
  if (!india) {
    const [newIndia] = await db.insert(organisations).values({
      name: 'India',
      slug: 'india',
      isActive: true,
    }).returning();
    india = newIndia;
  }
  console.log('✅ Organisation:', india.name);

  // Create India staff if not exists
  const existingIndiaStaff = await db.select().from(users).where(eq(users.email, 'staff@india.com'));
  if (existingIndiaStaff.length === 0) {
    await db.insert(users).values({
      email: 'staff@india.com',
      passwordHash: await bcrypt.hash('staff123', 10),
      name: 'India Staff',
      role: Role.STAFF,
      organisationId: india.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Created staff user: staff@india.com');

  // Create India customer if not exists
  const existingIndiaCustomer = await db.select().from(users).where(eq(users.email, 'customer@india.com'));
  if (existingIndiaCustomer.length === 0) {
    await db.insert(users).values({
      email: 'customer@india.com',
      passwordHash: await bcrypt.hash('customer123', 10),
      name: 'India Customer',
      role: Role.CUSTOMER,
      organisationId: india.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Created customer user: customer@india.com');

  // Create Sri Lanka organisation if not exists
  const existingSL = await db.select().from(organisations).where(eq(organisations.slug, 'sri-lanka'));
  let sriLanka = existingSL[0];
  if (!sriLanka) {
    const [newSL] = await db.insert(organisations).values({
      name: 'Sri Lanka',
      slug: 'sri-lanka',
      isActive: true,
    }).returning();
    sriLanka = newSL;
  }
  console.log('✅ Organisation:', sriLanka.name);

  // Create Sri Lanka staff if not exists
  const existingSLStaff = await db.select().from(users).where(eq(users.email, 'staff@srilanka.com'));
  if (existingSLStaff.length === 0) {
    await db.insert(users).values({
      email: 'staff@srilanka.com',
      passwordHash: await bcrypt.hash('staff123', 10),
      name: 'Sri Lanka Staff',
      role: Role.STAFF,
      organisationId: sriLanka.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Created staff user: staff@srilanka.com');

  // Create Sri Lanka customer if not exists
  const existingSLCustomer = await db.select().from(users).where(eq(users.email, 'customer@srilanka.com'));
  if (existingSLCustomer.length === 0) {
    await db.insert(users).values({
      email: 'customer@srilanka.com',
      passwordHash: await bcrypt.hash('customer123', 10),
      name: 'Sri Lanka Customer',
      role: Role.CUSTOMER,
      organisationId: sriLanka.id,
      isActive: true,
      emailVerified: true,
    }).returning();
  }
  console.log('✅ Created customer user: customer@srilanka.com');

  console.log('\n🎉 Seed completed!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@track.com / admin123');
  console.log('  Staff: staff@track.com / staff123');
  console.log('  Customer: customer@track.com / customer123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});