import { pgTable, varchar } from 'drizzle-orm/pg-core';

export const carriers = pgTable('carriers', {
  key: varchar('key', { length: 20 }).primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameCn: varchar('name_cn', { length: 255 }),
  nameHk: varchar('name_hk', { length: 255 }),
  url: varchar('url', { length: 500 }),
});

export type Carrier = typeof carriers.$inferSelect;
export type NewCarrier = typeof carriers.$inferInsert;
