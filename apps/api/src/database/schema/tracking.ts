import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const trackingJobStatusEnum = pgEnum('tracking_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'retrying',
]);

export const trackingJobs = pgTable('tracking_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id'),
  trackingNumber: text('tracking_number').notNull(),
  carrierCode: text('carrier_code').notNull(),
  status: trackingJobStatusEnum('status').notNull().default('pending'),
  operation: text('operation').notNull().default('gettrackinfo'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  lastAttemptAt: timestamp('last_attempt_at'),
  nextAttemptAt: timestamp('next_attempt_at'),
  lastError: text('last_error'),
  priority: integer('priority').notNull().default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const trackingJobEvents = pgTable('tracking_job_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  status: text('status').notNull(),
  error: text('error'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const trackingApiRateLimits = pgTable('tracking_api_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKey: text('api_key').notNull(),
  endpoint: text('endpoint').notNull(),
  requestCount: integer('request_count').notNull().default(0),
  windowStart: timestamp('window_start').notNull().defaultNow(),
  windowEnd: timestamp('window_end').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const trackingSettings = pgTable('tracking_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id'),
  webhookEnabled: boolean('webhook_enabled').notNull().default(true),
  pollingEnabled: boolean('polling_enabled').notNull().default(true),
  pollingIntervalMinutes: integer('polling_interval_minutes')
    .notNull()
    .default(60),
  retryAttempts: integer('retry_attempts').notNull().default(3),
  retryDelaySeconds: integer('retry_delay_seconds').notNull().default(60),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const trackingTransLog = pgTable('tracking_trans_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: text('tracking_number').notNull(),
  carrierCode: text('carrier_code').notNull(),
  retransAttemptedAt: timestamp('retrans_attempted_at').notNull().defaultNow(),
  metadata: jsonb('metadata'),
});

export type TrackingJob = typeof trackingJobs.$inferSelect;
export type NewTrackingJob = typeof trackingJobs.$inferInsert;
export type TrackingJobEvent = typeof trackingJobEvents.$inferSelect;
export type TrackingSettings = typeof trackingSettings.$inferSelect;
