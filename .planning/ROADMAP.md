# Project Roadmap

## Current Milestone

### Phase 1: Project Setup
- **Goal**: Initialize NestJS project with development environment
- **Status**: Completed
- **Depends on**: None
- **Plans**:
  - NestJS project exists in `backend/` folder
  - `.env` file configured
  - TypeScript path aliases, ESLint, Prettier configured

### Phase 2: Database Setup
- **Goal**: Configure Drizzle ORM with PostgreSQL
- **Status**: Completed
- **Depends on**: Phase 1
- **Plans**:
  - Install drizzle-orm, pg, drizzle-kit
  - Configure database connection
  - Create schema (organisations, users, sessions, verifications)

### Phase 3: Authentication Module
- **Goal**: Implement JWT and OAuth authentication
- **Status**: Completed
- **Depends on**: Phase 2
- **Plans**:
  - JWT strategy with access/refresh tokens
  - Email/password login
  - Google OAuth
  - Email verification and password reset

### Phase 4: RBAC Implementation
- **Goal**: Role-based access control system
- **Status**: Completed
- **Depends on**: Phase 3
- **Plans**:
  - Role enum (admin, staff, customer)
  - Roles decorator and guard
  - Protect endpoints by role

### Phase 5: Organisation & Multi-Tenancy
- **Goal**: Multi-tenant organisation system
- **Status**: Completed
- **Depends on**: Phase 4
- **Plans**:
  - Organisation CRUD
  - Tenant middleware
  - Organisation-scoped queries

### Phase 6: User Management
- **Goal**: User registration and profile management
- **Status**: Completed
- **Depends on**: Phase 5
- **Plans**:
  - Registration with organisation creation
  - Profile endpoints
  - Admin user management

### Phase 7: Security & Best Practices
- **Goal**: Security headers, rate limiting, validation
- **Status**: Completed
- **Depends on**: Phase 6
- **Plans**:
  - Helmet security headers
  - CORS configuration
  - Rate limiting (100 req/min)
  - ValidationPipe with whitelist

### Phase 8: Testing & Documentation
- **Goal**: Unit tests and Swagger documentation
- **Status**: Completed
- **Depends on**: Phase 7
- **Plans**:
  - Unit tests for AuthService, JWT Strategy, RolesGuard
  - Swagger API documentation with Bearer auth

### Phase 9: Seed Data
- **Goal**: Database seed script with sample data
- **Status**: Completed
- **Depends on**: Phase 7
- **Plans**:
  - Seed script with admin, staff, customer users
  - npm script: `npm run seed`

### Phase 10: API Versioning
- **Goal**: Versioned API endpoints
- **Status**: Completed
- **Depends on**: Phase 7
- **Plans**:
  - Global prefix: `/api`
  - URI-based versioning: `/api/v1`

### Phase 11: WebSockets
- **Goal**: Real-time events with Socket.io
- **Status**: Completed
- **Depends on**: Phase 10
- **Plans**:
  - EventsGateway with JWT authentication
  - Join/leave organisation rooms
  - Emit helpers for organisation/user

### Phase 14: Email Notifications
- **Goal**: Email notifications with BullMQ queue
- **Status**: Completed
- **Depends on**: Phase 11
- **Plans**:
  - SMTP configuration
  - Email templates (verification, password reset, welcome)
  - BullMQ async job queue
  - Redis-based retry with exponential backoff

### Phase 15: lets build in-app notification system for bell notification

**Goal:** In-app notification system API with WebSocket delivery, organisation-scoped notifications, template-based content with metadata, and CRUD + WebSocket events
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06
**Depends on:** Phase 14
**Plans:** 2 plans
**Status:** Completed

Plans:
- [x] 15-01-PLAN.md — Create Notification database schema with Drizzle ORM
- [x] 15-02-PLAN.md — Create NotificationsModule with CRUD API and EventsGateway integration

### Phase 16: Admin Auth Connect

**Goal:** Connect admin Next.js app to backend NestJS authentication
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Depends on:** None (backend auth complete in Phase 3)
**Plans:** 4 plans
**Status:** Planned

Plans:
- [ ] 01-01-PLAN.md — Fix auth integration (use-auth.ts + api.ts alignment)
- [ ] 01-02-PLAN.md — Create login page
- [ ] 01-03-PLAN.md — Create auth middleware
- [ ] 01-04-PLAN.md — Connect core pages (dashboard, shipments, quotes, notifications)

### Phase 17: quote management, we need same layout as user management. lets discuss in detail

**Goal:** Quote management page for admin dashboard — same layout as user management (Phase 16), with table view, CRUD operations, stats cards, filters, and role-based permissions.
**Requirements**: TBD
**Depends on:** Phase 16
**Plans:** 2 plans
**Status:** Completed

Plans:
- [x] 17-01-PLAN.md — Backend Extension: DELETE, pagination, filtering, stats, email triggers
- [x] 17-02-PLAN.md — Frontend: Quote management page with table, stats, CRUD, WebSocket
