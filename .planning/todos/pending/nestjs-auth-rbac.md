---
title: Create NestJS Auth Module with RBAC
date: 2026-04-19
priority: high
status: completed
---

# Create NestJS Auth Module with RBAC

## Tech Stack

- NestJS
- Drizzle ORM + PostgreSQL
- Passport.js (passport-local, passport-jwt, passport-google-oauth20)
- JWT with access + refresh tokens

---

## Phase 1: Project Setup ✅

### 1.1 Initialize NestJS Project
- [x] NestJS project exists in `backend/` folder

### 1.2 Configure Development Environment
- [x] `.env` file configured with DATABASE_URL, JWT settings, Google OAuth
- [x] TypeScript path aliases configured
- [x] ESLint and Prettier configured

---

## Phase 2: Database Setup (Drizzle + PostgreSQL) ✅

### 2.1 Install Dependencies
- [x] `drizzle-orm`, `pg`, `drizzle-kit` installed
- [x] `bcrypt`, `class-validator`, `class-transformer` installed

### 2.2 Configure Drizzle
- [x] `drizzle.config.ts` created
- [x] Database connection in `src/database/index.ts`
- [x] Schema folder structure created

### 2.3 Create Schema
- [x] `organisations` table defined
- [x] `users` table defined with role enum
- [x] `sessions` table defined for refresh tokens
- [x] `verifications` table defined for email/password reset
- [x] Schema exported in `src/database/schema/index.ts`
- [x] Tables created in database via migration

---

## Phase 3: Authentication Module ✅

### 3.1 Create Auth Module Structure
- [x] Auth module created with controller and service
- [x] Auth DTOs created with validation decorators
- [x] EmailService for sending emails
- [x] VerificationsService for token management

### 3.2 Implement JWT Strategy
- [x] `@nestjs/jwt`, `passport`, `passport-jwt` installed
- [x] JWT strategy created in `src/modules/auth/strategies/jwt.strategy.ts`
- [x] JWT options configured with 15min access token expiry
- [x] JWT guard created

### 3.3 Implement Email/Password Login
- [x] LocalStrategy created
- [x] Password hashing with bcrypt
- [x] Login endpoint with token generation
- [x] Access + refresh token generation

### 3.4 Implement Google OAuth
- [x] `passport-google-oauth20` installed
- [x] GoogleStrategy created
- [x] Google login endpoints configured

### 3.5 Implement Token Refresh
- [x] Refresh endpoint created
- [x] Refresh token validation and new token generation
- [x] Session management in database

### 3.6 Implement Logout
- [x] Logout endpoint created
- [x] Refresh token invalidation

### 3.7 Email Verification
- [x] `POST /auth/verify-email` — Verify email with token
- [x] `POST /auth/resend-verification` — Resend verification email
- [x] Verification tokens stored in database (24h expiry)

### 3.8 Password Reset
- [x] `POST /auth/forgot-password` — Request password reset
- [x] `POST /auth/reset-password` — Reset password with token

---

## Phase 4: RBAC Implementation ✅

### 4.1 Create Role Enum
- [x] Role enum created in `src/common/enums/role.enum.ts`
- [x] Roles: admin, staff, customer

### 4.2 Create Role Guards
- [x] `@Roles` decorator created in `src/common/decorators/roles.decorator.ts`
- [x] RolesGuard created in `src/common/guards/roles.guard.ts`

### 4.3 Apply Guards to Endpoints
- [x] Admin-only endpoints protected
- [x] Staff endpoints protected
- [x] OpenAPI documentation with @ApiBearerAuth

---

## Phase 5: Organisation & Multi-Tenancy ✅

### 5.1 Organisation Service
- [x] Organisation module and controller created
- [x] CRUD endpoints: create, findOne, update, delete

### 5.2 Multi-Tenant Filtering
- [x] Tenant middleware created in `src/common/middleware/tenant.middleware.ts`
- [x] TenantGuard created
- [x] Organisation ID extracted from JWT

### 5.3 User-Organisation Management
- [x] User-organisation relationship implemented
- [x] Organisation-scoped queries

---

## Phase 6: User Management ✅

### 6.1 Register Endpoint
- [x] Registration endpoint with organisation creation
- [x] Email uniqueness validation
- [x] Password hashing
- [x] Auto-send verification email

### 6.2 Profile Endpoint
- [x] Get current user profile (`/users/me`)
- [x] Update user (admin only)
- [x] Delete user (admin only)

---

## Phase 7: Security & Best Practices ✅

### 7.1 Security Headers
- [x] `helmet` installed and configured
- [x] CORS configured with env variable

### 7.2 Rate Limiting
- [x] `@nestjs/throttler` installed
- [x] Rate limiting: 100 req/min (configurable in app.module.ts)

### 7.3 Validation
- [x] ValidationPipe with whitelist mode
- [x] Transform enabled
- [x] class-validator on all DTOs

---

## Phase 8: Testing & Documentation ✅

### 8.1 Unit Tests
- [x] AuthService tests (10 tests) — `src/modules/auth/auth.service.spec.ts`
- [x] JWT Strategy tests (2 tests) — `src/modules/auth/strategies/jwt.strategy.spec.ts`
- [x] RolesGuard tests (7 tests) — `src/common/guards/roles.guard.spec.ts`

### 8.2 API Documentation
- [x] `@nestjs/swagger` installed
- [x] Swagger configured in main.ts
- [x] All endpoints documented with tags, operations, responses
- [x] Bearer auth configured

---

## Phase 9: Seed Data ✅

### 9.1 Create Seed Script
- [x] Seed script created in `src/database/seeds/seed.ts`
- [x] npm script added: `npm run seed`
- [x] Admin, staff, customer users created

---

## Phase 10: API Versioning ✅

### 10.1 Versioning Configuration
- [x] Global prefix: `/api`
- [x] Version enabled: `/api/v1`
- [x] URI-based versioning

---

## Phase 11: WebSockets ✅

### 11.1 Events Gateway
- [x] EventsGateway created in `src/modules/events/events.gateway.ts`
- [x] Socket.io with JWT authentication
- [x] Join/leave organisation rooms
- [x] Emit to organisation or user helpers

---

## Created Files

```
backend/
├── src/
│   ├── main.ts                                    # App bootstrap with security, versioning, Swagger
│   ├── app.module.ts                              # Root module with ThrottlerModule
│   ├── common/
│   │   ├── enums/
│   │   │   ├── role.enum.ts                       # Role enum (admin, staff, customer)
│   │   │   └── index.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts                 # @Roles() decorator
│   │   │   ├── public.decorator.ts               # @Public() decorator
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts                 # JWT authentication guard
│   │   │   ├── roles.guard.ts                    # Role-based guard
│   │   │   ├── tenant.guard.ts                   # Tenant verification guard
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts              # Multi-tenant middleware
│   │   └── utils/
│   │       ├── slugify.ts                         # Slugify utility
│   │       ├── hash-password.ts                  # Hash and compare passwords
│   │       └── index.ts
│   ├── database/
│   │   ├── index.ts                               # Drizzle database connection
│   │   ├── schema/
│   │   │   ├── index.ts                          # Schema exports
│   │   │   ├── user.ts                           # User table (users)
│   │   │   ├── organisations.ts                  # Organisation table
│   │   │   ├── sessions.ts                      # Session table
│   │   │   └── verifications.ts                 # Verification tokens table
│   │   ├── create-db.ts                           # Database creation script
│   │   ├── migrate.ts                             # Migration script
│   │   ├── create-verifications.ts              # Create verifications table
│   │   └── seeds/
│   │       └── seed.ts                            # Seed data script
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts                     # Auth module
│       │   ├── auth.controller.ts                 # Auth controller with all endpoints
│       │   ├── auth.service.ts                    # Auth service
│       │   ├── auth.service.spec.ts               # Auth service tests
│       │   ├── email.service.ts                   # Email service (logger)
│       │   ├── verifications.service.ts           # Verification tokens service
│       │   ├── dto/
│       │   │   ├── auth.dto.ts                   # Auth DTOs with Swagger decorators
│       │   │   └── index.ts
│       │   └── strategies/
│       │       ├── jwt.strategy.ts               # JWT strategy
│       │       ├── jwt.strategy.spec.ts           # JWT strategy tests
│       │       ├── local.strategy.ts              # Local (email/password) strategy
│       │       ├── google.strategy.ts            # Google OAuth strategy
│       │       └── index.ts
│       ├── users/
│       │   ├── users.module.ts                   # Users module
│       │   ├── users.controller.ts               # Users controller
│       │   └── services.ts                        # Users, Organisations, Sessions services
│       ├── organisations/
│       │   ├── organisations.module.ts           # Organisations module
│       │   └── organisations.controller.ts       # Organisations controller
│       └── events/
│           ├── events.module.ts                  # Events module
│           └── events.gateway.ts                 # WebSocket gateway
├── .env                                           # Environment variables
├── drizzle.config.ts                              # Drizzle configuration
└── package.json                                   # Scripts: start, build, seed, test
```

---

## API Endpoints (v1)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | - | Register new user with organisation |
| POST | `/api/v1/auth/login` | Public | - | Email/password login |
| POST | `/api/v1/auth/refresh` | Public | - | Refresh access token |
| POST | `/api/v1/auth/logout` | JWT | All | Logout |
| POST | `/api/v1/auth/verify-email` | Public | - | Verify email with token |
| POST | `/api/v1/auth/resend-verification` | Public | - | Resend verification email |
| POST | `/api/v1/auth/forgot-password` | Public | - | Request password reset |
| POST | `/api/v1/auth/reset-password` | Public | - | Reset password with token |
| GET | `/api/v1/auth/google` | Public | - | Google OAuth redirect |
| GET | `/api/v1/auth/google/callback` | Public | - | Google OAuth callback |
| GET | `/api/v1/auth/me` | JWT | All | Get current user profile |
| GET | `/api/v1/users` | JWT | admin, staff | Get all users in organisation |
| GET | `/api/v1/users/me` | JWT | All | Get current user profile |
| GET | `/api/v1/users/:id` | JWT | admin | Get user by ID |
| PATCH | `/api/v1/users/:id` | JWT | admin | Update user |
| DELETE | `/api/v1/users/:id` | JWT | admin | Delete user |
| POST | `/api/v1/organisations` | JWT | admin | Create organisation |
| GET | `/api/v1/organisations/me` | JWT | All | Get current user organisation |
| GET | `/api/v1/organisations/:id` | JWT | admin | Get organisation by ID |
| PATCH | `/api/v1/organisations/:id` | JWT | admin | Update organisation |
| DELETE | `/api/v1/organisations/:id` | JWT | admin | Delete organisation |

---

## WebSocket Events

| Event | Description |
|-------|-------------|
| `connection` | Client connected (with optional JWT auth) |
| `join-organisation` | Join organisation room |
| `leave-organisation` | Leave organisation room |
| `message` | Test event |

**Socket URL:** `ws://localhost:3000`

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@track.com | admin123 |
| Staff | staff@track.com | staff123 |
| Customer | customer@track.com | customer123 |

---

## Related

- Note: `.planning/notes/auth-strategy.md`