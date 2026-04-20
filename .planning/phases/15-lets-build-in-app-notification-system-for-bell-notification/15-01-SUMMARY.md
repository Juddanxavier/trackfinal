---
phase: "15"
plan: "01"
subsystem: "notifications"
tags: ["database", "drizzle", "notifications"]
dependency_graph:
  requires: []
  provides: ["NOTIF-01", "NOTIF-02"]
  affects: ["notifications-module"]
tech_stack:
  added: ["drizzle-orm"]
  patterns: ["org-scoped-queries", "template-based-content"]
key_files:
  created:
    - "backend/src/database/schema/notifications.ts"
  modified:
    - "backend/src/database/schema/index.ts"
decisions:
  - "Notification schema uses organisationId + userId for org-scoped queries"
  - "titleKey for template-based content instead of hardcoded text"
  - "data as jsonb for flexible metadata storage"
  - "expiresAt auto-set to NOW + 30 days for auto-expiry"
  - "CASCADE delete when org or user is deleted"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-19T11:12:43Z"
---

# Phase 15 Plan 01 Summary: Notification Database Schema

## One-liner
Created Notification model with Drizzle ORM for org-scoped, template-based notifications with 30-day auto-expiry

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create Notification Schema | - | backend/src/database/schema/notifications.ts |
| 2 | Export Notification Schema | - | backend/src/database/schema/index.ts |

## Schema Structure

**notifications table:**
- `id` - UUID primary key with auto-generation
- `organisationId` - UUID reference to organisations (CASCADE delete)
- `userId` - UUID reference to users (CASCADE delete)
- `titleKey` - String for template key (e.g., "quote.assigned")
- `data` - JSONB for template variables
- `isRead` - Boolean default false for read/unread state
- `createdAt` - Timestamp auto-set on creation
- `expiresAt` - Timestamp auto-set to NOW + 30 days

## Deviation from Plan
None - plan executed exactly as written.

## Threat Flags
None - schema definition only, no runtime surface.

## Self-Check: PASSED
- [x] backend/src/database/schema/notifications.ts exists
- [x] backend/src/database/schema/index.ts exports notifications
- [x] Schema follows existing Drizzle ORM patterns
