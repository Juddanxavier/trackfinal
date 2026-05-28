import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { branches } from './branches';

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
    branchId: uuid('branch_id').references(() => branches.id),
    isActive: boolean('is_active').default(false),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_organisation_id').on(table.organisationId),
    index('idx_users_branch_id').on(table.branchId),
    index('idx_users_role').on(table.role),
    index('idx_users_phone').on(table.phoneNumber),
  ],
);

export const userTwoFactor = pgTable('user_two_factor', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id),
  secret: text('secret').default(''),
  verified: boolean('verified').notNull().default(false),
  enabled: boolean('enabled').notNull().default(false),
  backupCodes: text('backup_codes').array().notNull().default([]),
  pendingCodeHash: text('pending_code_hash'),
  pendingCodeExpiresAt: timestamp('pending_code_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type UserTwoFactor = typeof userTwoFactor.$inferSelect;
export type NewUserTwoFactor = typeof userTwoFactor.$inferInsert;
