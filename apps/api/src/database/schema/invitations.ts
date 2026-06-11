import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { branches } from './branches';
import { users } from './user';

export const invitationStatuses = pgTable('invitation_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id),
  branchId: uuid('branch_id').references(() => branches.id),
  role: text('role').notNull(), // 'admin' | 'staff'
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  userId: uuid('user_id'), // When accepted
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
