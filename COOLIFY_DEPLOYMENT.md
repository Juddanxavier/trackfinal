# Coolify Deployment Guide

## Prerequisites
- Coolify instance with PostgreSQL and Redis already running
- Git repository (or upload source code)

## Step 1: Prepare Environment

### Get PostgreSQL Connection Details from Coolify
1. Go to your Coolify dashboard
2. Find your PostgreSQL resource
3. Copy the connection string (format: `postgresql://user:password@host:port/database`)

### Get Redis Connection Details from Coolify
1. Find your Redis resource
2. Copy the host and port (usually `localhost:6379` or `redis:6379` if using Docker network)

## Step 2: Deploy Backend (NestJS)

### Create New Application
1. In Coolify, click "Create New Resource" → "Application"
2. Select Git provider and your repository
3. Choose "Nixpacks" or "Dockerfile" as build method

### Build Settings
```
Build Pack: Nixpacks
Start Command: pnpm turbo build && pnpm --filter @track/api start:prod
Working Directory: /app
```

### Environment Variables

Copy and fill in these values:

```env
# APPLICATION
NODE_ENV=production
PORT=4000
APP_NAME=GT Express
FRONTEND_URL=https://your-domain.com

# DATABASE (from Coolify PostgreSQL)
DATABASE_URL=postgresql://coolify_user:coolify_password@10.0.0.1:5432/gtexpress

# AUTHENTICATION (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# REDIS (from Coolify Redis)
REDIS_HOST=10.0.0.2
REDIS_PORT=6379

# SMTP (use your email provider)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=GT Express

# SENTRY (optional)
SENTRY_DSN=

# CORS
CORS_ORIGIN=https://your-domain.com

# TRACKING
TRACKING_PROVIDER=17track
TRACK17_API_KEY=your-17track-api-key

# NOTIFICATIONS
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_WHATSAPP_ENABLED=false
NOTIFICATION_INAPP_ENABLED=true
NOTIFICATION_USE_QUEUE=true
```

### Port Configuration
- Internal Port: `4000`
- Exposed Port: `4000` (or custom)

### Health Check
```
Endpoint: /api
Interval: 30s
Timeout: 10s
```

## Step 3: Deploy Admin (Next.js)

### Create New Application
1. In Coolify, click "Create New Resource" → "Application"
2. Select your repository

### Build Settings
```
Build Pack: Nixpacks
Start Command: npm run start
```

### Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Domain Configuration
- Domain: `your-domain.com`
- Port: `3000`

## Network Configuration (Important!)

Since backend and frontend may be on different containers, ensure:

1. Backend's `DATABASE_URL` uses the actual PostgreSQL host IP (not `localhost`)
2. Backend's `REDIS_HOST` uses the actual Redis host IP (not `localhost`)
3. `FRONTEND_URL` should be your admin domain
4. `CORS_ORIGIN` should include your admin domain

## Alternative: Docker Compose in Coolify

If you prefer, create one compose resource for everything:

```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=host.docker.internal
      - REDIS_PORT=6379
    ports:
      - "4000:4000"

  admin:
    build: ./admin
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:4000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is accessible from the container
- Ensure database exists

### Redis Connection Failed
- Use host IP, not `localhost`
- Check Redis is accessible from the container

### CORS Errors
- Ensure `CORS_ORIGIN` includes your frontend domain
- Use full URL with protocol (https://)

### Build Failed
- Check Nixpacks/Node version supports NestJS
- Ensure all dependencies install correctly

## Quick Checklist

- [ ] Generate JWT secrets
- [ ] Copy PostgreSQL connection string
- [ ] Copy Redis host:port
- [ ] Configure SMTP credentials
- [ ] Set correct domain URLs
- [ ] Add CORS origins
- [ ] Verify health check endpoint works