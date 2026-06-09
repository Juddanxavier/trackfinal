import { relations } from 'drizzle-orm/relations';
import {
  users,
  sessions,
  organisations,
  verifications,
  notifications,
  quotes,
} from './schema';

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  verifications: many(verifications),
  notifications: many(notifications),
  quotes_userId: many(quotes, {
    relationName: 'quotes_userId_users_id',
  }),
  quotes_deletedBy: many(quotes, {
    relationName: 'quotes_deletedBy_users_id',
  }),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  notifications: many(notifications),
  quotes: many(quotes),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organisation: one(organisations, {
    fields: [notifications.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  organisation: one(organisations, {
    fields: [quotes.organisationId],
    references: [organisations.id],
  }),
  user_userId: one(users, {
    fields: [quotes.userId],
    references: [users.id],
    relationName: 'quotes_userId_users_id',
  }),
  user_deletedBy: one(users, {
    fields: [quotes.deletedBy],
    references: [users.id],
    relationName: 'quotes_deletedBy_users_id',
  }),
}));
