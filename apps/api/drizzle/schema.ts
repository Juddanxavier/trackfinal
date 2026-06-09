import {
  pgTable,
  unique,
  uuid,
  text,
  boolean,
  timestamp,
  foreignKey,
  jsonb,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const role = pgEnum('role', ['admin', 'staff', 'customer']);
export const shipmentStatus = pgEnum('shipment_status', [
  'pending',
  'in_transit',
  'delivered',
  'cancelled',
]);

export const organisations = pgTable(
  'organisations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
  },
  (table) => [unique('organisations_slug_key').on(table.slug)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    revoked: boolean().default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'sessions_user_id_fk',
    }).onDelete('cascade'),
  ],
);

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    passwordHash: text('password_hash'),
    name: text().notNull(),
    role: role().default('customer').notNull(),
    googleId: text('google_id'),
    organisationId: uuid('organisation_id'),
    isActive: boolean('is_active').default(true),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    phoneNumber: text('phone_number'),
  },
  (table) => [
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: 'users_organisation_id_fk',
    }).onDelete('set null'),
    unique('users_email_key').on(table.email),
    unique('users_phone_number_unique').on(table.phoneNumber),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    token: text().notNull(),
    type: text().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    usedAt: timestamp('used_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'verifications_user_id_fkey',
    }).onDelete('cascade'),
    unique('verifications_token_key').on(table.token),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organisationId: uuid('organisation_id').notNull(),
    userId: uuid('user_id').notNull(),
    titleKey: text('title_key').notNull(),
    data: jsonb().default({}),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: 'notifications_organisation_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'notifications_user_id_fkey',
    }).onDelete('cascade'),
  ],
);

export const shipments = pgTable('shipments', {
  id: uuid().defaultRandom().primaryKey().notNull(),
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
  originCountry: text('origin_country').notNull(),
  destinationCountry: text('destination_country').notNull(),
  status: text().default('pending').notNull(),
  goodsType: text('goods_type').default('general'),
  weight: text(),
  track17Data: jsonb('track17_data'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const quotes = pgTable(
  'quotes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organisationId: uuid('organisation_id').notNull(),
    userId: uuid('user_id').notNull(),
    assignedToId: uuid('assigned_to_id'),
    originCountry: text('origin_country').notNull(),
    destinationCountry: text('destination_country').notNull(),
    status: text().default('pending').notNull(),
    goodsType: text('goods_type').default('general').notNull(),
    weight: numeric({ precision: 10, scale: 2 }).notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    remarks: text(),
    price: numeric({ precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    deletedBy: uuid('deleted_by'),
    deletedReason: text('deleted_reason'),
  },
  (table) => [
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: 'quotes_organisation_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'quotes_user_id_fkey',
    }),
    foreignKey({
      columns: [table.deletedBy],
      foreignColumns: [users.id],
      name: 'quotes_deleted_by_fkey',
    }),
  ],
);
