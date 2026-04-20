---
title: Auth & Organisation Strategy
date: 2026-04-19
context: NestJS API system with RBAC and multi-tenant organisation
---

# Auth & Organisation Strategy

## Technology Decisions

| Category | Choice | Rationale |
|----------|--------|------------|
| Database | Drizzle + PostgreSQL | Lightweight, SQL-like, good DX |
| Auth | Passport.js | Ready-made strategies for email/password + Google |
| JWT | Access + Refresh tokens | Better UX for multi-frontend system |
| RBAC | admin, staff, customer | Simple three-role model |

## RBAC Model

- **Admin:** Full access within organisation
- **Staff:** Managed by admin, access based on role
- **Customer:** Frontend-only, no direct API access

## Organisation

- Multi-tenant with data isolation
- Query filters by `org_id`
- One user → one organisation (for now)

## Future Considerations

- **Sentry:** Add for error tracking/observability in later phase
- **OAuth providers:** Structure allows adding more (GitHub, etc.)
- **Permission system:** Resource-level permissions can be added later if needed

## Related

- Todo: `.planning/todos/pending/nestjs-auth-rbac.md`