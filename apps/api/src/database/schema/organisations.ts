import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { branches } from './branches';

export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  countryCode: text('country_code').default('US'),
  currency: text('currency').default('USD'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  trackingDomain: text('tracking_domain'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const organisationsRelations = relations(organisations, ({ many }) => ({
  branches: many(branches),
}));

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
