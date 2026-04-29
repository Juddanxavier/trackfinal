import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'in_transit',
  'delivered',
  'cancelled',
  'exception',
]);

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id'),
  assignedToId: uuid('assigned_to_id'),
  trackingNumber: text('tracking_number').notNull(),
  whiteLabelTrackingCode: text('white_label_tracking_code'),
  carrierCode: text('carrier_code').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  recipientAddress: text('recipient_address'),
  originCountry: text('origin_country').default('Unknown'),
  destinationCountry: text('destination_country').default('Unknown'),
  status: shipmentStatusEnum('status').notNull().default('pending'),
  goodsType: text('goods_type'),
  weight: integer('weight'),
  track17Data: jsonb('track17_data'),
  deliveredAt: timestamp('delivered_at'),
  archivedAt: timestamp('archived_at'),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  deletedReason: text('deleted_reason'),
  notifyOnUpdate: jsonb('notify_on_update').default({
    email: true,
    sms: false,
  }),
  notifyEmail: text('notify_email'),
  notifyPhone: text('notify_phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_shipments_organisation_id').on(table.organisationId),
  index('idx_shipments_status').on(table.status),
  index('idx_shipments_tracking_number').on(table.trackingNumber),
  index('idx_shipments_created_at').on(table.createdAt),
  index('idx_shipments_carrier_code').on(table.carrierCode),
  index('idx_shipments_deleted_at').on(table.deletedAt),
]);

export const shipmentEvents = pgTable('shipment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull(),
  status: text('status').notNull(),
  statusRaw: text('status_raw'),
  description: text('description'),
  location: text('location'),
  eventTime: timestamp('event_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_shipment_events_shipment_id').on(table.shipmentId),
  index('idx_shipment_events_event_time').on(table.eventTime),
]);

export const shipmentsRelations = relations(shipments, ({ many }) => ({
  events: many(shipmentEvents),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentEvents.shipmentId],
    references: [shipments.id],
  }),
}));

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type NewShipmentEvent = typeof shipmentEvents.$inferInsert;
