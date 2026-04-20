# Phase 15: lets build in app notification system for bell notification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 15-lets-build-in-app-notification-system-for-bell-notification
**Areas discussed:** Triggers, Delivery, Read state, Scope, Content, API Scope, Bell UI

---

## Triggers

| Option | Description | Selected |
|--------|-------------|----------|
| Entity assignments | Quote assigned to staff, user mentioned in comment | |
| System alerts | Status changes, approvals, deadlines | |
| Both entity + system | All of the above combined | ✓ |

**User's choice:** Both entity + system

---

## Delivery

| Option | Description | Selected |
|--------|-------------|----------|
| WebSocket (recommended) | Real-time push via existing EventsGateway | ✓ |
| Polling API | Client polls endpoint every N seconds | |
| Both WebSocket + fallback | Real-time when connected, poll as backup | |

**User's choice:** WebSocket (recommended)

---

## Read state

| Option | Description | Selected |
|--------|-------------|----------|
| Mark as read on view | Single mark-read when user sees notification list | |
| Mark individual as read | User can mark specific notifications read/unread | |
| Both + auto-expire | Individual control + auto-clear after 30 days | ✓ |

**User's choice:** Both + auto-expire

---

## Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Organisation-scoped (recommended) | Users only see org's notifications | ✓ |
| Global across orgs | Admins see all orgs' notifications | |

**User's choice:** Organisation-scoped (recommended)

---

## Content

| Option | Description | Selected |
|--------|-------------|----------|
| Template-based with metadata | Title key, data payload, generated at read time | ✓ |
| Pre-rendered text stored | Full text stored in DB, no runtime formatting | |

**User's choice:** Template-based with metadata

---

## Bell UI

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown panel (recommended) | Click bell → dropdown list of recent notifications | |
| Navigate to dedicated page | Click bell → go to /notifications page | |

**User's choice:** we are creating api

**Notes:** User wants to focus on API first

---

## API Scope

| Option | Description | Selected |
|--------|-------------|----------|
| CRUD + WebSocket events (recommended) | Create/read/mark-read endpoints + emit events on trigger | ✓ |
| Notifications read only | Just list and mark-read, triggers from other existing services | |
| Full system | CRUD + triggers + events + cleanup jobs | |

**User's choice:** CRUD + WebSocket events (recommended)

---

## Deferred Ideas

- Bell icon UI component — separate frontend work
- Notification preferences/settings — per-user opt-in/out
- Email fallback for critical notifications — outside scope
