import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './user';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  refreshTokenVersion: integer('refresh_token_version').notNull().default(1),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  revoked: boolean('revoked').default(false),
  revokedAt: timestamp('revoked_at'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});
