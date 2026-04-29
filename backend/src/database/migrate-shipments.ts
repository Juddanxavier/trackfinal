import { db } from '../database';
import { shipments, shipmentEvents } from '../database/schema/shipments';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating shipments table...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS shipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL,
      user_id UUID,
      tracking_number TEXT NOT NULL,
      carrier_code TEXT NOT NULL,
      provider TEXT DEFAULT '17track',
      external_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      status_raw TEXT,
      last_event TEXT,
      last_location TEXT,
      last_event_time TIMESTAMP,
      origin_country TEXT,
      destination_country TEXT,
      sender_name TEXT,
      sender_email TEXT,
      sender_phone TEXT,
      delivered_at TIMESTAMP,
      raw_data JSONB,
      public_code TEXT UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  console.log('Creating shipment_events table...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS shipment_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shipment_id UUID NOT NULL,
      status TEXT NOT NULL,
      status_raw TEXT,
      description TEXT,
      location TEXT,
      event_time TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
    )
  `);

  console.log('Creating indexes...');

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_shipments_organisation ON shipments(organisation_id)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON shipment_events(shipment_id)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)`,
  );

  console.log('Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
