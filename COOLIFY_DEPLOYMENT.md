# Coolify Deployment Guide

## Prerequisites
- Coolify instance with PostgreSQL and Redis already running
- Git repository pushed to GitHub/GitLab/Bitbucket
- TurboRepo monorepo structure

## Architecture

```
apps/
├── admin/     # Next.js 16 (Port 3000)
└── api/       # NestJS (Port 4000)
```

## Step 1: Create API Resource

1. In Coolify, click **Create New Resource** → **Application**
2. Select your Git provider and repository
3. Choose **Dockerfile** as build method
4. Set **Build Target**: `api-runner`
5. Set **Port**: `4000`

### API Environment Variables
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_HOST=<redis-ip>
REDIS_PORT=6379
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=GT Express
FRONTEND_URL=https://your-admin-domain.com
CORS_ORIGIN=https://your-admin-domain.com
```

## Step 2: Create Admin Resource

1. Click **Create New Resource** → **Application**
2. Select your Git provider and repository
3. Choose **Dockerfile** as build method
4. Set **Build Target**: `admin-runner`
5. Set **Port**: `3000`

### Admin Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-admin-domain.com
```

## Domain Setup

| Resource | Domain | Points To |
|----------|--------|-----------|
| API | api.yourdomain.com | Port 4000 |
| Admin | yourdomain.com | Port 3000 |

## Health Endpoints

| Service | Health Check URL |
|---------|------------------|
| API | `GET https://api.yourdomain.com/api` |
| Admin | `https://yourdomain.com` |

## Troubleshooting

### Build failing
- Ensure `pnpm-lock.yaml` is committed
- Check Node.js version (20.x required)

### Database connection
- Verify `DATABASE_URL` format
- Check PostgreSQL is accessible from Coolify

### CORS errors
- Set `CORS_ORIGIN` to exact frontend URL
- Include protocol (https://)

## Quick Reference

| Item | Value |
|------|-------|
| Node Version | 20.x |
| Package Manager | pnpm 9.0.0 |
| Build Command | `pnpm run build` |
| API Entry | `node dist/main.js` |
| Admin Entry | `node server.js` |