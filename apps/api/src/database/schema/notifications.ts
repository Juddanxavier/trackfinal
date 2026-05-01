import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations, users } from './index';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    titleKey: text('title_key').notNull(),
    data: jsonb('data').default({}),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at').defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_id').on(table.userId),
    index('idx_notifications_organisation_id').on(table.organisationId),
    index('idx_notifications_is_read').on(table.isRead),
    index('idx_notifications_created_at').on(table.createdAt),
  ],
);
