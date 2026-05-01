import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './user';

export const invitationStatuses = pgTable('invitation_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id),
  role: text('role').notNull(), // 'staff' | 'customer'
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  userId: uuid('user_id'), // When accepted
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
