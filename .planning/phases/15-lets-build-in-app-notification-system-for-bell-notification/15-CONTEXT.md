# Phase 15: lets build in app notification system for bell notification - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

In-app notification system with bell icon support. Backend API for storing, delivering, and managing user notifications. Uses existing EventsGateway (WebSocket) for real-time delivery. Frontend (bell UI) is separate.

</domain>

<decisions>
## Implementation Decisions

### Triggers
- **D-01:** Both entity + system triggers
  - Entity: Quote assigned to staff, user mentioned in comment
  - System: Status changes, approvals, deadlines

### Delivery
- **D-02:** WebSocket via existing EventsGateway
  - Real-time push when notifications are created
  - Organisation rooms already exist

### Read/Unread State
- **D-03:** Individual mark-read/unread + auto-expire
  - Users can mark specific notifications read/unread
  - Notifications auto-clear after 30 days

### Scope
- **D-04:** Organisation-scoped
  - Users only see their organisation's notifications
  - Tenant middleware already in place (from Phase 5)

### Content Format
- **D-05:** Template-based with metadata
  - Title key stored (e.g., "quote.assigned")
  - Data payload stored as JSON
  - Message rendered at read time

### API Scope
- **D-06:** CRUD + WebSocket events
  - Create/read/mark-read endpoints
  - Emit events on notification trigger
  - Trigger logic lives in originating services

### Bell UI
- **D-07:** API only for this phase
  - Frontend/bell UI is separate work
  - API should support all frontend needs

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Infrastructure
- `backend/src/modules/events/events.gateway.ts` — WebSocket gateway with JWT auth and org rooms
- `backend/src/common/middleware/tenant.middleware.ts` — Multi-tenant filtering
- `backend/src/database/schema/` — Existing schema patterns (users, organisations)

### Backend Patterns
- `backend/src/modules/` — Module structure to follow
- `backend/src/modules/auth/` — DTO patterns, validation
- `backend/src/modules/quotes/` — Recent module with similar CRUD patterns

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- EventsGateway: Already has JWT auth, org room management
- Tenant middleware: Already filters by organisationId
- DTO validation: class-validator patterns from auth module

### Established Patterns
- NestJS module structure: module/controller/service/dto
- UUID primary keys
- Standard CRUD endpoints

### Integration Points
- Notifications module will emit via EventsGateway
- Other services (quotes, auth) will trigger notification creation
- Tenant middleware for org-scoped queries

</code_context>

<specifics>
## Specific Ideas

- "We are creating API" — focus on backend first, frontend separate
- Use existing WebSocket infrastructure, don't reinvent real-time delivery

</specifics>

<deferred>
## Deferred Ideas

- Bell icon UI component — separate frontend work
- Notification preferences/settings — per-user opt-in/out
- Email fallback for critical notifications — outside scope

---

*Phase: 15-lets-build-in-app-notification-system-for-bell-notification*
*Context gathered: 2026-04-19*
