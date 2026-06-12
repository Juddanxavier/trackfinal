import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function migrateNotifications() {
  console.log('Starting notification tables migration...');

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email_enabled BOOLEAN DEFAULT true,
        whatsapp_enabled BOOLEAN DEFAULT true,
        in_transit_notifications BOOLEAN DEFAULT true,
        delivered_notifications BOOLEAN DEFAULT true,
        exceptions_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organisation_id, user_id)
      );
    `);
    console.log('✅ notification_preferences table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ notification_preferences table already exists');
    } else {
      throw err;
    }
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        title_key TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ notification_logs table ready');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('ℹ️ notification_logs table already exists');
    } else {
      throw err;
    }
  }

  try {
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_shipment_id ON notification_logs(shipment_id);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_title_key ON notification_logs(title_key);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_status ON notification_logs(channel, status);
    `);
    console.log('✅ notification_logs indexes ready');
  } catch (err) {
    console.warn('⚠️ Index creation warning:', err);
  }

  console.log('✅ All notification tables migration complete');
  await pool.end();
}

migrateNotifications().catch((err) => {
  console.error('❌ Notification migration failed:', err);
  process.exit(1);
});
