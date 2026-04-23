# Phase 17: Quote Management - Research

**Researched:** 2026-04-20
**Status:** Complete

<objective>
Research how to implement Phase 17: Quote management page (same layout as user management from Phase 16).
Answer: "What do I need to know to PLAN this phase well?"
</objective>

<files_to_read>
- .planning/phases/17-quote-management-we-need-same-layout-as-user-management-lets/17-CONTEXT.md (USER DECISIONS)
- backend/src/database/schema/quotes.ts (Quote model)
- admin/app/users/page.tsx (Reference pattern)
</files_to_read>

<additional_context>
**Phase description:** Quote management page for admin dashboard — same layout pattern as user management (Phase 16).

**Phase requirement IDs:** TBD (from ROADMAP.md)

**Context Decisions to Honor:**
- D-02: Standard columns — ID, customer email, origin country, destination country, status, createdAt, updatedAt
- D-03: Manage only (no create in dashboard) — View, Edit status/price, Delete
- D-04: Stats cards — Both status breakdown + key metrics
- D-06: Full filters — Status, date range, customer email, origin/destination
- D-07: WebSocket push for new quotes
- D-11: Staff + customer notifications via email/WebSocket
</additional_context>

<research_findings>

## 1. Backend Quotes API — PARTIAL

**Existing Endpoints (quotes.controller.ts):**
- `GET /quotes` — organisation quotes (staff+admin)
- `GET /quotes/me` — user's quotes
- `GET /quotes/pending` — pending quotes
- `PATCH /quotes/:id` — update status/price/assignedToId
- Missing: DELETE endpoint, GET by ID, pagination, filtering, sorting

**Service Gaps:**
- No delete method in quotes.service.ts
- No pagination support
- No search/filter queries
- No stats/count endpoints

**Recommendation:** Extend backend before frontend work. Need:
- DELETE /quotes/:id (admin only)
- GET /quotes/:id (view single quote)
- Pagination params (page, limit)
- Filter params (status, search, dateRange)
- Sort params (sortBy, sortOrder)
- Stats endpoint for dashboard cards

## 2. WebSocket Events — PATTERN EXISTS

**EventsGateway helpers:**
```typescript
emitToOrganisation(organisationId: string, event: string, data: any)
emitToUser(userId: string, event: string, data: any)
```

**Current Integration:**
- quotes.service.ts already calls notificationsService on new quote
- EventsGateway has emit helpers ready to use
- D-07 can be implemented via `emitToOrganisation('org:${orgId}', 'new-quote', quote)`

## 3. Email Notifications — INTEGRATED

**Current Behavior (quotes.service.ts:42-48):**
- Creates notifications for staff on new quote
- Missing: email triggers for status changes (D-11)

**D-11 Requirements:**
- Status changed to "quoted" → email to customer
- Status changed to "accepted"/"rejected" → email to customer

**Recommendation:** Add email triggers in quotes.service.ts update method

## 4. Role Permissions — ALREADY IMPLEMENTED

**Current Guards:**
- All quotes endpoints require JwtAuthGuard
- GET /quotes requires Role.ADMIN or Role.STAFF
- PATCH /quotes/:id requires Role.ADMIN or Role.STAFF
- Missing: DELETE (none), Create (none for dashboard)

**Matches D-03:**
- View: staff+admin ✓
- Edit status/price: staff+admin ✓
- Delete: needs admin-only guard (not implemented)
- No create from dashboard ✓

## 5. Frontend Reference — Phase 16

**admin/app/users/page.tsx patterns:**
- Table with sorting columns
- Search input with debounce
- Role filter dropdown
- Pagination (numbered with first/prev/next/last)
- Stats cards: total, active, customers, staff
- Dialogs: invite, edit, delete
- Sheets: view details

**Quote Adaptations:**
- Stats cards: change to status breakdown (pending, quoted, accepted, rejected)
- Filters: status, date range, email search, origin/destination
- Table columns: email, origin, destination, status, dates
</research_findings>

<validation_architecture>

## Validation Strategy

**Phase 17 Validation:**

| Dimension | Approach |
|-----------|----------|
| 1. Syntax | TypeScript compile in admin/ |
| 2. Types | Quote type matches schema |
| 3. Links | Backend API endpoints exist |
| 4. RBAC | DELETE needs admin-only |
| 5. UI | Page loads, table renders |
| 6. Flow | CRUD operations work |
| 7. Edge | Empty, pagination |
| 8. Integration | Backend extended first |

**Blocking Dependencies:**
- Backend needs DELETE, pagination, stats, filters before frontend complete
- Recommend: Plan backend extension as part of Phase 17

</validation_architecture>

<output>
Write to: .planning/phases/17-quote-management-we-need-same-layout-as-user-management-lets/17-RESEARCH.md
</output>