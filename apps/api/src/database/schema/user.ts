import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';

export const roleEnum = pgEnum('role', ['admin', 'staff', 'customer']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    name: text('name').notNull(),
    phoneNumber: text('phone_number'),
    role: roleEnum('role').notNull().default('customer'),
    googleId: text('google_id'),
    organisationId: uuid('organisation_id').references(() => organisations.id),
    isActive: boolean('is_active').default(true),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_organisation_id').on(table.organisationId),
    index('idx_users_role').on(table.role),
  ],
);
