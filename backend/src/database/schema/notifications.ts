import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations, users } from './index';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  titleKey: text('title_key').notNull(), // e.g., "quote.assigned"
  data: jsonb('data').default({}), // Template variables as JSON
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').defaultNow(), // Auto-set to NOW + 30 days
});
