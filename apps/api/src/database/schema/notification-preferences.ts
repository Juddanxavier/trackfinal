import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations, users, shipments } from './index';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emailEnabled: boolean('email_enabled').default(true),
  whatsappEnabled: boolean('whatsapp_enabled').default(true),
  inTransitNotifications: boolean('in_transit_notifications').default(true),
  deliveredNotifications: boolean('delivered_notifications').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shipmentId: uuid('shipment_id').references(() => shipments.id, {
    onDelete: 'cascade',
  }),
  channel: text('channel').notNull(),
  titleKey: text('title_key').notNull(),
  data: jsonb('data').default({}),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
