# Phase 16 Context: User Management Page

## Project Info
- **Project**: Track Admin
- **Type**: Next.js 16 + NestJS Backend + Drizzle ORM
- **Date**: 2026-04-20

## Previous Phase
- Phase 15: In-app notification system with WebSocket

## Research Summary

### Current State
- User roles: admin, staff, customer
- 3 organisations: Track HQ, India, Sri Lanka (seeded)
- No user management page exists
- Existing TanStack Table implementation in data-table.tsx

### Requirements Confirmed
1. **Invite/Send Invite**: Staff can send invites (create customer for their org)
2. **Edit Access**: Admin can edit all users, Staff can edit their org's customers
3. **Org Switcher**: Navbar dropdown to select organisation
4. **Numbered Pagination**: 1, 2, 3... style

### Permissions Matrix
| Action | Admin | Staff |
|--------|-------|-------|
| View all orgs users | Yes | No |
| View own org users | Yes | Yes |
| Create user (any role) | Yes | No |
| Create customer only | Yes | Yes |
| Edit any user | Yes | No |
| Edit own org customer | Yes | Yes |
| Delete any user | Yes | No |
| Delete own org customer | Yes | Yes |

### Table Features
- Sorting: By name, email, role, createdAt
- Search: By name or email
- Filter: By role (admin/staff/customer)
- Pagination: Numbered with page size selector