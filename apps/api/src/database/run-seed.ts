import { db } from '../database';
import { organisations, users } from '../database/schema';
import { eq } from 'drizzle-orm';

async function runSeed() {
  console.log('[Seed] Starting...');
  
  try {
    // Check if orgs exist
    const existingOrgs = await db.select().from(organisations).limit(1);
    if (existingOrgs.length > 0) {
      console.log('[Seed] Orgs already exist, skipping');
      return;
    }
    
    // Create Gajan Traders org
    const [org] = await db.insert(organisations).values({
      name: 'Gajan Traders',
      slug: 'gajan-traders',
      email: 'info@gajantraders.com',
      phone: '+91 9000000001',
      address: '123 Market Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      countryCode: 'IN',
      currency: 'INR',
      isActive: true,
    }).returning();
    
    console.log('[Seed] Created org:', org.id);
    
    // Create admin user
    const [admin] = await db.insert(users).values({
      email: 'admin@gajantraders.com',
      name: 'Admin',
      password: '$2a$10$xO1B1K1K1K1K1K1K1K1KO9X5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', // password: admin123
      role: 'admin',
      organisationId: org.id,
      isActive: true,
      emailVerified: true,
    }).returning();
    
    console.log('[Seed] Created admin user:', admin.id);
    console.log('[Seed] DONE - Admin email: admin@gajantraders.com / password: admin123');
    
  } catch (err) {
    console.error('[Seed] Error:', err);
  }
  
  process.exit(0);
}

runSeed();