# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**Not detected:**
- No external API clients or SDKs in dependencies
- The application is a basic NestJS skeleton with no third-party service integrations

## Data Storage

**Databases:**
- Not configured - No database ORM or driver detected in `backend/package.json`
- No Prisma, TypeORM, Sequelize, or other database libraries present

**File Storage:**
- Local filesystem only (no cloud storage integration)
- No S3, Azure Blob, Google Cloud Storage clients

**Caching:**
- Not configured - No Redis, Memcached, or in-memory caching libraries

## Authentication & Identity

**Auth Provider:**
- Not configured - No auth library detected (no Passport, NextAuth, Auth0, Firebase, etc.)
- Application uses no authentication mechanism

## Monitoring & Observability

**Error Tracking:**
- Not configured - No Sentry, Bugsnag, or similar error tracking

**Logs:**
- Console logging via NestJS built-in logger
- No external logging services (no Datadog, Loggly, Papertrail)

## CI/CD & Deployment

**Hosting:**
- Not specified

**CI Pipeline:**
- Not configured - No GitHub Actions, CircleCI, or similar CI/CD detected

## Environment Configuration

**Required env vars:**
- `PORT` - Application port (defaults to 3000) - used in `backend/src/main.ts`

**Secrets location:**
- No secrets management detected - No environment file (.env) present

## Webhooks & Callbacks

**Incoming:**
- Not configured

**Outgoing:**
- Not configured

---

*Integration audit: 2026-04-19*