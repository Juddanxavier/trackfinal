import { pgTable, text, timestamp, uuid, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organisations, users } from './index';

export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'in_transit', 'delivered', 'cancelled']);

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  assignedToId: uuid('assigned_to_id'),
  trackingNumber: text('tracking_number').notNull(),
  whiteLabelTrackingCode: text('white_label_tracking_code'),
  carrierCode: text('carrier_code').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  recipientAddress: text('recipient_address'),
  originCountry: text('origin_country').notNull(),
  destinationCountry: text('destination_country').notNull(),
  status: shipmentStatusEnum('status').notNull().default('pending'),
  goodsType: text('goods_type').default('general'),
  weight: text('weight'),
  track17Data: jsonb('track17_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  organisation: one(organisations, {
    fields: [shipments.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [shipments.userId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [shipments.assignedToId],
    references: [users.id],
  }),
}));