import { pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    postalCode: text('postal_code'),
    countryCode: text('country_code').default('US'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_branches_organisation_id').on(table.organisationId),
  ],
);

export const branchesRelations = relations(branches, ({ one }) => ({
  organisation: one(organisations, {
    fields: [branches.organisationId],
    references: [organisations.id],
  }),
}));

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
