# Phase 17: quote management, we need same layout as user management. lets discuss in detail - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Quote management page for the admin dashboard — same layout pattern as user management page (Phase 16). Includes table view, CRUD operations, and role-based permissions.

</domain>

<decisions>
## Implementation Decisions

### Table Features
- **D-01:** Agent's Discretion
  - User said "You decide" for table features
  - Follow Phase 16 patterns: sorting, search, filter, pagination

### Table Columns
- **D-02:** Standard columns
  - ID, customer email, origin country, destination country, status, createdAt, updatedAt

### Quote Actions
- **D-03:** Manage only (no create in dashboard)
  - View quotes (all roles)
  - Edit status/price (staff, admin)
  - Delete quotes (admin only)
  - Create happens via public form or customer API (not dashboard)

### Role Permissions Matrix
| Action | Admin | Staff | Customer |
|--------|-------|-------|----------|
| View all org quotes | Yes | Yes | Own only |
| Edit status/price | Yes | Yes | No |
| Delete quote | Yes | No | No |
| Create quote | No | No | Yes (via public form) |

### Stats Cards
- **D-04:** Both status breakdown + key metrics
  - Status: Pending, Quoted, Accepted, Rejected counts
  - Metrics: Total quotes, recent quotes, conversion rate

### Status Workflow
- **D-05:** Open-ended pending allowed
  - Quotes can stay in "pending" indefinitely (customer not required to reply)
  - Staff sets status to "quoted" when respond with price
  - Final status is optional — pending can remain pending

### Search/Filter
- **D-06:** Full filters
  - Status filter (pending, quoted, accepted, rejected)
  - Date range filter
  - Customer email search
  - Route filter (origin country, destination country)

### Real-Time Updates
- **D-07:** WebSocket push
  - New quote triggers WebSocket event via EventsGateway
  - Dashboard shows notification + auto-adds to table
  - Uses existing EventsGateway from Phase 11

### Customer Details
- **D-08:** Email + phone only
  - Staff sees contact info from quote form
  - No profile link, no quote history needed

### Archive/Purge
- **D-09:** Agent's Discretion
  - User said "You decide"
  - Standard: archive after 12 months, auto-delete after 24 months

### Cron/Scheduled Jobs
- **D-10:** Pending reminders + weekly digest
  - Pending reminder: notify staff if no response after 7 days
  - Weekly digest: summary of new quotes every Monday

### Backend Notifications
- **D-11:** Staff + customer notifications
  - New quote: WebSocket push to staff (immediate)
  - Status changed to "quoted": email notification to customer
  - Status changed to "accepted"/"rejected": email notification to customer

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 16 Context
- `.planning/phases/16-user-management-page/16-CONTEXT.md` — Layout patterns to follow

### Backend Schema
- `backend/src/database/schema/quotes.ts` — Quote model: id, organisationId, userId, originCountry, destinationCountry, status, goodsType, weight, email, phone, remarks, price, createdAt, updatedAt
- `backend/src/modules/quotes/quotes.service.ts` — Existing service: create, update, findById, findByUser
- `backend/src/modules/quotes/quotes.controller.ts` — Existing controller patterns

### Frontend Patterns
- `admin/app/users/page.tsx` — Table patterns to replicate
- `admin/components/data-table.tsx` — Reusable TanStack Table component

### User Management Patterns to Reuse
- Sorting: By name, email, role, createdAt
- Search: By name or email → adapt to quote fields
- Filter: By role → adapt to status filter
- Pagination: Numbered with page size selector

</canonical_refs>

_ctx>
## Existing Code Insights

### Reusable Assets
- data-table.tsx: Reusable TanStack Table component
- quotes.service.ts: Already has create/update/findById
- quotes.schema.ts: Quote model with status enum

### Established Patterns
- Phase 16 user management: Table with sorting, search, filter, pagination
- Role-based permissions matrix matching

### Integration Points
- Use existing quotes module (backend/src/modules/quotes/)
- Connect to data-table.tsx component
- Follow user page layout pattern

</code_context>

<specifics>
## Specific Ideas

- "same layout as user management" — replicate Phase 16 patterns
- Standard columns: customer email, origin, destination, status, dates
- Full CRUD with role-based permissions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 17-quote-management-we-need-same-layout-as-user-management-lets*
*Context gathered: 2026-04-20*