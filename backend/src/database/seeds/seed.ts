import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { db } from '../../database';
import {
  users,
  organisations,
  sessions,
  quotes,
  shipments,
} from '../../database/schema';
import { eq } from 'drizzle-orm';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';

async function seed() {
  console.log('🌱 Starting seed...');

  // Check if admin already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@track.com'));
  if (existingAdmin.length > 0) {
    console.log('✅ Admin user already exists, continuing to add orgs...');
  }

  // Create default organisation if not exists
  const existingOrg = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, 'track-hq'));
  let org = existingOrg[0];
  if (!org) {
    const [newOrg] = await db
      .insert(organisations)
      .values({
        name: 'Track HQ',
        slug: 'track-hq',
        isActive: true,
      })
      .returning();
    org = newOrg;
  }
  console.log('✅ Organisation:', org.name);

  // Create admin user if not exists
  const existingAdminUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@track.com'));
  if (existingAdminUser.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db
      .insert(users)
      .values({
        email: 'admin@track.com',
        passwordHash,
        name: 'Admin User',
        role: Role.ADMIN,
        organisationId: org.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Admin user: admin@track.com');

  // Create staff user if not exists
  const existingStaffUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'staff@track.com'));
  if (existingStaffUser.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'staff@track.com',
        passwordHash: await bcrypt.hash('staff123', 10),
        name: 'Staff User',
        role: Role.STAFF,
        organisationId: org.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Staff user: staff@track.com');

  // Create customer user if not exists
  const existingCustomerUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'customer@track.com'));
  if (existingCustomerUser.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'customer@track.com',
        passwordHash: await bcrypt.hash('customer123', 10),
        name: 'Customer User',
        role: Role.CUSTOMER,
        organisationId: org.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Customer user: customer@track.com');

  // Create India organisation if not exists
  const existingIndia = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, 'india'));
  let india = existingIndia[0];
  if (!india) {
    const [newIndia] = await db
      .insert(organisations)
      .values({
        name: 'India',
        slug: 'india',
        isActive: true,
      })
      .returning();
    india = newIndia;
  }
  console.log('✅ Organisation:', india.name);

  // Create India staff if not exists
  const existingIndiaStaff = await db
    .select()
    .from(users)
    .where(eq(users.email, 'staff@india.com'));
  if (existingIndiaStaff.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'staff@india.com',
        passwordHash: await bcrypt.hash('staff123', 10),
        name: 'India Staff',
        role: Role.STAFF,
        organisationId: india.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Created staff user: staff@india.com');

  // Create India customer if not exists
  const existingIndiaCustomer = await db
    .select()
    .from(users)
    .where(eq(users.email, 'customer@india.com'));
  if (existingIndiaCustomer.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'customer@india.com',
        passwordHash: await bcrypt.hash('customer123', 10),
        name: 'India Customer',
        role: Role.CUSTOMER,
        organisationId: india.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Created customer user: customer@india.com');

  // Create Sri Lanka organisation if not exists
  const existingSL = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, 'sri-lanka'));
  let sriLanka = existingSL[0];
  if (!sriLanka) {
    const [newSL] = await db
      .insert(organisations)
      .values({
        name: 'Sri Lanka',
        slug: 'sri-lanka',
        isActive: true,
      })
      .returning();
    sriLanka = newSL;
  }
  console.log('✅ Organisation:', sriLanka.name);

  // Create Sri Lanka staff if not exists
  const existingSLStaff = await db
    .select()
    .from(users)
    .where(eq(users.email, 'staff@srilanka.com'));
  if (existingSLStaff.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'staff@srilanka.com',
        passwordHash: await bcrypt.hash('staff123', 10),
        name: 'Sri Lanka Staff',
        role: Role.STAFF,
        organisationId: sriLanka.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Created staff user: staff@srilanka.com');

  // Create Sri Lanka customer if not exists
  const existingSLCustomer = await db
    .select()
    .from(users)
    .where(eq(users.email, 'customer@srilanka.com'));
  if (existingSLCustomer.length === 0) {
    await db
      .insert(users)
      .values({
        email: 'customer@srilanka.com',
        passwordHash: await bcrypt.hash('customer123', 10),
        name: 'Sri Lanka Customer',
        role: Role.CUSTOMER,
        organisationId: sriLanka.id,
        isActive: true,
        emailVerified: true,
      })
      .returning();
  }
  console.log('✅ Created customer user: customer@srilanka.com');

  console.log('\n🎉 Base seed completed!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@track.com / admin123');
  console.log('  Staff: staff@track.com / staff123');
  console.log('  Customer: customer@track.com / customer123');

  // Get all organisations and seed quotes for each
  const allOrgs = await db.select().from(organisations);
  const allStaff = await db
    .select()
    .from(users)
    .where(eq(users.role, Role.STAFF));

  for (const org of allOrgs) {
    let staffForOrg = allStaff.find((s) => s.organisationId === org.id);

    if (!staffForOrg) {
      const passwordHash = await bcrypt.hash('staff123', 10);
      const [newStaff] = await db
        .insert(users)
        .values({
          email: `staff@${org.slug}.com`,
          passwordHash,
          name: `${org.name} Staff`,
          role: Role.STAFF,
          organisationId: org.id,
          isActive: true,
          emailVerified: true,
        })
        .returning();
      staffForOrg = newStaff;
      console.log(`✅ Created staff for: ${org.name}`);
    }

    await seedQuotes(org.id, staffForOrg, org.name);
    await seedShipments(org.id, staffForOrg, org.name);
  }

  console.log('\n🎉 All seed completed!');
  process.exit(0);

  async function seedQuotes(orgId: any, staffUserId: any, orgName: string) {
    if (!orgId) return;

    const existingQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.organisationId, orgId));
    if (existingQuotes.length >= 100) {
      console.log(
        `✅ ${orgName}: ${existingQuotes.length} quotes already exist`,
      );
      return;
    }

    const origins = [
      'China',
      'India',
      'Japan',
      'Korea',
      'USA',
      'UK',
      'Germany',
      'France',
      'Italy',
      'UAE',
    ];
    const destinations = [
      'Sri Lanka',
      'USA',
      'UK',
      'India',
      'Australia',
      'Canada',
      'Germany',
      'France',
      'Japan',
      'Singapore',
    ];
    const statuses = ['pending', 'quoted', 'accepted', 'rejected'];
    const goodsTypes = [
      'general',
      'electronics',
      'fragile',
      'machinery',
      'perishable',
      'clothing',
      'food',
      'medical',
    ];
    const emails = [
      'john.doe@gmail.com',
      'jane.smith@yahoo.com',
      'bob.wilson@outlook.com',
      'alice.brown@hotmail.com',
      'charlie.lee@gmail.com',
      'david.chen@yahoo.com',
      'emma.watson@outlook.com',
      'frank.liu@gmail.com',
      'grace.huang@yahoo.com',
      'henry.zhang@outlook.com',
    ];
    const priceRange = [100, 500, 1000, 2500, 5000, 10000];

    const quoteCount = 100;
    interface QuoteItem {
      email: string;
      origin: string;
      destination: string;
      status: string;
      goodsType: string;
      weight: string;
      phone: string;
      price: string | null;
    }
    const quoteData: QuoteItem[] = [];

    for (let i = 0; i < quoteCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hasPrice = status === 'quoted' || status === 'accepted';

      quoteData.push({
        email: emails[Math.floor(Math.random() * emails.length)],
        origin: origins[Math.floor(Math.random() * origins.length)],
        destination:
          destinations[Math.floor(Math.random() * destinations.length)],
        status,
        goodsType: goodsTypes[Math.floor(Math.random() * goodsTypes.length)],
        weight: String(Math.floor(Math.random() * 500) + 1),
        phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        price: hasPrice
          ? String(priceRange[Math.floor(Math.random() * priceRange.length)])
          : null,
      });
    }

    for (const q of quoteData) {
      await db.insert(quotes).values({
        organisationId: orgId,
        userId: staffUserId?.id || orgId,
        assignedToId: staffUserId?.id || null,
        originCountry: q.origin,
        destinationCountry: q.destination,
        status: q.status as any,
        goodsType: q.goodsType as any,
        weight: q.weight,
        email: q.email,
        phone: q.phone,
        price: q.price || null,
      });
    }

    console.log(`✅ ${orgName}: Created ${quoteData.length} quotes`);
  }

  async function seedShipments(orgId: any, staffUserId: any, orgName: string) {
    if (!orgId) return;

    const existingShipments = await db
      .select()
      .from(shipments)
      .where(eq(shipments.organisationId, orgId));
    if (existingShipments.length > 0) {
      console.log(
        `✅ ${orgName}: ${existingShipments.length} shipments already exist`,
      );
      return;
    }

    const generateWhiteLabelCode = () => {
      const digits = '0123456789';
      let code = '';
      for (let i = 0; i < 14; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
      }
      return code;
    };

    const shipmentData = [
      {
        trackingNumber: '1Z999AA10123456784',
        carrierCode: 'ups',
        recipientName: 'John Doe',
        recipientEmail: 'john@ship.com',
        recipientPhone: '+94771234567',
        originCountry: 'China',
        destinationCountry: 'Sri Lanka',
        status: 'pending' as const,
        goodsType: 'Electronics',
        weight: 25,
      },
      {
        trackingNumber: 'JD0144000012345678',
        carrierCode: 'dhl',
        recipientName: 'Jane Smith',
        recipientEmail: 'jane@ship.com',
        recipientPhone: '+19171234567',
        originCountry: 'USA',
        destinationCountry: 'UK',
        status: 'in_transit' as const,
        goodsType: 'Clothing',
        weight: 10,
      },
      {
        trackingNumber: '9400123456789012345678',
        carrierCode: 'usps',
        recipientName: 'Bob Wilson',
        recipientEmail: 'bob@ship.com',
        recipientPhone: '+919812345678',
        originCountry: 'India',
        destinationCountry: 'Australia',
        status: 'in_transit' as const,
        goodsType: 'Books',
        weight: 5,
      },
      {
        trackingNumber: 'RK123456789GB',
        carrierCode: 'royalmail',
        recipientName: 'Alice Brown',
        recipientEmail: 'alice@ship.com',
        recipientPhone: '+447123456789',
        originCountry: 'UK',
        destinationCountry: 'Canada',
        status: 'delivered' as const,
        goodsType: 'Toys',
        weight: 15,
      },
      {
        trackingNumber: 'YT1234567890123',
        carrierCode: 'yunexpress',
        recipientName: 'Charlie Lee',
        recipientEmail: 'charlie@ship.com',
        recipientPhone: '+61412345678',
        originCountry: 'China',
        destinationCountry: 'USA',
        status: 'pending' as const,
        goodsType: 'General',
        weight: 50,
      },
    ];

    for (const s of shipmentData) {
      await db.insert(shipments).values({
        organisationId: orgId,
        userId: staffUserId?.id || orgId,
        trackingNumber: s.trackingNumber,
        whiteLabelTrackingCode: generateWhiteLabelCode(),
        carrierCode: s.carrierCode,
        recipientName: s.recipientName,
        recipientEmail: s.recipientEmail,
        recipientPhone: s.recipientPhone,
        originCountry: s.originCountry,
        destinationCountry: s.destinationCountry,
        status: s.status,
        goodsType: s.goodsType,
        weight: s.weight,
      });
    }

    console.log(`✅ ${orgName}: Created ${shipmentData.length} shipments`);
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
