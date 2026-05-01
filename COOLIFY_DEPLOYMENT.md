# Coolify Deployment Guide

## Prerequisites
- Coolify instance with PostgreSQL and Redis already running
- Git repository with TurboRepo structure

## Architecture

```
apps/
├── admin/     # Next.js 16 (Port 3000)
└── api/       # NestJS (Port 4000)
```

## Deploy API (NestJS)

### Create New Application
1. In Coolify, click "Create New Resource" → "Application"
2. Select Git provider and your repository
3. Choose "Dockerfile" as build method
4. Set build target: `api-runner`

### Environment Variables
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/gtexpress
REDIS_HOST=redis-host-ip
REDIS_PORT=6379
JWT_SECRET=<generate-64-char>
JWT_REFRESH_SECRET=<generate-64-char>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=GT Express
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

## Deploy Admin (Next.js)

### Create New Application
1. Click "Create New Resource" → "Application"
2. Select Git provider
3. Choose "Dockerfile" as build method
4. Set build target: `admin-runner`

### Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Docker Compose (Alternative)

For Docker Compose deployments, use:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: api-runner
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      # ... other env vars

  admin:
    build:
      context: .
      dockerfile: Dockerfile
      target: admin-runner
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000/api
```

## Health Endpoints

| Service | Health Check |
|---------|---------------|
| API | `GET http://localhost:4000/api` |
| Admin | `GET http://localhost:3000/health` |

## Troubleshooting

### Build failing
- Ensure `pnpm-lock.yaml` is committed
- Check Node.js version (20.x required)

### Database connection
- Verify `DATABASE_URL` format
- Check PostgreSQL is accessible

### CORS errors
- Set `CORS_ORIGIN` to exact frontend URL
- Include protocol (https://)