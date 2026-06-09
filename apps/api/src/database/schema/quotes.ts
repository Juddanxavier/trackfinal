import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { branches, organisations, users } from './index';

export const quoteStatusEnum = pgEnum('quote_status', [
  'pending',
  'quoted',
  'accepted',
  'rejected',
  'deleted',
]);

export const goodsTypeEnum = pgEnum('goods_type', [
  'general',
  'fragile',
  'hazardous',
  'perishable',
  'electronics',
  'machinery',
  'chemicals',
  'other',
]);

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id').notNull(),
    branchId: uuid('branch_id').references(() => branches.id),
    userId: uuid('user_id').notNull(),
    assignedToId: uuid('assigned_to_id'),
    originCountry: text('origin_country').notNull(),
    destinationCountry: text('destination_country').notNull(),
    status: quoteStatusEnum('status').notNull().default('pending'),
    goodsType: goodsTypeEnum('goods_type').notNull().default('general'),
    weight: numeric('weight', { precision: 10, scale: 2 }).notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    remarks: text('remarks'),
    price: numeric('price', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
    deletedBy: uuid('deleted_by'),
    deletedReason: text('deleted_reason'),
    archivedAt: timestamp('archived_at'),
  },
  (table) => [
    index('idx_quotes_organisation_id').on(table.organisationId),
    index('idx_quotes_branch_id').on(table.branchId),
    index('idx_quotes_status').on(table.status),
    index('idx_quotes_created_at').on(table.createdAt),
    index('idx_quotes_archived_at').on(table.archivedAt),
  ],
);
