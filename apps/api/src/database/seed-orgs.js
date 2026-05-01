import { db } from '../database/index.js'
import { sql } from 'drizzle-orm'
import { organisations } from './schema/organisations.js'
import bcrypt from 'bcrypt'

async function seed() {
  console.log('Clearing data...')
  
  await db.execute(sql`DELETE FROM quotes`)
  await db.execute(sql`DELETE FROM shipments`)
  await db.execute(sql`DELETE FROM shipment_events`)
  await db.execute(sql`DELETE FROM sessions`)
  await db.execute(sql`DELETE FROM notifications`)
  await db.execute(sql`DELETE FROM notification_preferences`)
  await db.execute(sql`DELETE FROM verifications`)
  await db.execute(sql`DELETE FROM users`)
  await db.execute(sql`DELETE FROM organisations`)
  
  console.log('Inserting organisations...')
  
  const orgs = await db.insert(organisations).values([
    {
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
    },
    {
      name: 'Lanka Mahal',
      slug: 'lanka-mahal',
      email: 'info@lankamahal.com',
      phone: '+94 700000001',
      address: '456 Temple Road',
      city: 'Colombo',
      state: 'Western',
      countryCode: 'LK',
      currency: 'LKR',
      isActive: true,
    },
  ]).returning()
  
  console.log('✅ Seeded', orgs.length, 'organisations')
  
  // Get org IDs
  const gajan = orgs.find(o => o.slug === 'gajan-traders')
  const lanka = orgs.find(o => o.slug === 'lanka-mahal')
  
  console.log('Inserting users...')
  
  // bcrypt hash for 'admin123' (rounds=10)
  const hash = await bcrypt.hash('admin123', 10)
  
  await db.execute(sql`
    INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified)
    VALUES 
      ('Admin User', 'admin@gajantraders.com', ${hash}, 'admin', '${gajan.id}', true, true),
      ('Admin User', 'admin@lankamahal.com', ${hash}, 'admin', '${lanka.id}', true, true)
  `)
  
  console.log('✅ Seeded 2 users')
  console.log('   admin@gajantraders.com / admin123')
  console.log('   admin@lankamahal.com / admin123')
}

seed().catch(console.error)