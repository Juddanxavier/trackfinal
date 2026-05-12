import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

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
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
