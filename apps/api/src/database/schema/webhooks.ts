import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';

export const webhookEndpoints = pgTable(
  'webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id),
    url: text('url').notNull(),
    secret: text('secret').notNull(),
    events: text('events').array().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    lastTriggeredAt: timestamp('last_triggered_at'),
    lastSuccessAt: timestamp('last_success_at'),
    lastFailureAt: timestamp('last_failure_at'),
    failureCount: integer('failure_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_webhook_endpoints_org').on(table.organisationId),
  ],
);

export const webhookDeliveryLogs = pgTable(
  'webhook_delivery_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => webhookEndpoints.id),
    event: text('event').notNull(),
    payload: jsonb('payload').notNull(),
    status: text('status').notNull().default('pending'),
    statusCode: integer('status_code'),
    responseBody: text('response_body'),
    attempt: integer('attempt').notNull().default(1),
    maxAttempts: integer('max_attempts').notNull().default(3),
    nextRetryAt: timestamp('next_retry_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_webhook_delivery_logs_endpoint').on(table.endpointId),
    index('idx_webhook_delivery_logs_status').on(table.status),
  ],
);

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type WebhookDeliveryLog = typeof webhookDeliveryLogs.$inferSelect;
