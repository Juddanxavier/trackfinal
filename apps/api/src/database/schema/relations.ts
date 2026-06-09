import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { branches } from './branches';
import { users } from './user';
import { shipments, shipmentEvents } from './shipments';
import { quotes } from './quotes';
import { trackingJobs, trackingJobEvents } from './tracking';

export const organisationsRelations = relations(organisations, ({ many }) => ({
  branches: many(branches),
}));

export const branchesRelations = relations(branches, ({ one }) => ({
  organisation: one(organisations, {
    fields: [branches.organisationId],
    references: [organisations.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  branch: one(branches, {
    fields: [shipments.branchId],
    references: [branches.id],
  }),
  events: many(shipmentEvents),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentEvents.shipmentId],
    references: [shipments.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  organisation: one(organisations, {
    fields: [quotes.organisationId],
    references: [organisations.id],
  }),
  branch: one(branches, {
    fields: [quotes.branchId],
    references: [branches.id],
  }),
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [quotes.assignedToId],
    references: [users.id],
  }),
}));

export const trackingJobsRelations = relations(trackingJobs, ({ many }) => ({
  events: many(trackingJobEvents),
}));

export const trackingJobEventsRelations = relations(
  trackingJobEvents,
  ({ one }) => ({
    job: one(trackingJobs, {
      fields: [trackingJobEvents.jobId],
      references: [trackingJobs.id],
    }),
  }),
);
