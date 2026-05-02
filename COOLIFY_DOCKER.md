# Coolify Deployment Guide - Docker (Step by Step)

## Overview

This guide deploys **Track** (TurboRepo with @track/api and @track/admin) in Coolify using Docker.

## Architecture

```
apps/
├── admin/     # Next.js → Port 3000
└── api/       # NestJS → Port 4000
```

## Step 1: Prepare Coolify

### Connect GitHub Repository
1. Go to Coolify dashboard
2. **Settings** → **Sources** → **Add Source**
3. Select **GitHub**
4. Authenticate with GitHub
5. Select your repository

---

## Step 2: Deploy API (NestJS)

### Create Application
1. Click **Create New Resource**
2. Select **Application**
3. **Source**: GitHub → Select your repo
4. **Branch**: `main`

### Configure Build
5. **Build Pack**: Select **Dockerfile** (not Nixpacks)
6. **Dockerfile**: `Dockerfile`
7. **Dockerfile Target**: `api-runner`

### Set Environment Variables
8. Go to **Environment Variables** tab
9. Add these variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/gtexpress
REDIS_HOST=your-redis-ip
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
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Configure Networking
10. **Port**: `4000`
11. **Exposed Port**: `4000`

### Enable Health Check
12. **Health Check**: `http://localhost:4000/api`
13. **Interval**: `30s`
14. **Timeout**: `10s`
15. **Retries**: `3`

### Save & Deploy
16. Click **Save**
17. Click **Deploy**

---

## Step 3: Deploy Admin (Next.js)

### Create Application
1. Click **Create New Resource**
2. Select **Application**
3. **Source**: GitHub → Select your repo
4. **Branch**: `main`

### Configure Build
5. **Build Pack**: Select **Dockerfile**
6. **Dockerfile**: `Dockerfile`
7. **Dockerfile Target**: `admin-runner`

### Set Environment Variables
8. Add these variables:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

> Note: Update `NEXT_PUBLIC_API_URL` with the actual API domain after deployment.

### Configure Networking
10. **Port**: `3000`
11. **Exposed Port**: `3000`

### Enable Health Check
12. **Health Check**: `http://localhost:3000/health`
13. **Interval**: `30s`
14. **Timeout**: `10s`
15. **Retries**: `3`

### Save & Deploy
16. Click **Save**
17. Click **Deploy**

---

## Step 4: Configure Domain (Optional)

### API Domain
1. Go to API application
2. **Settings** → **Domains**
3. Add domain (e.g., `api.yourdomain.com`)
4. Set SSL (Let's Encrypt or custom)

### Admin Domain
1. Go to Admin application
2. **Settings** → **Domains**
3. Add domain (e.g., `admin.yourdomain.com`)
4. Set SSL

### Update Environment Variables
After setting domains:
1. Go to Admin app → **Environment Variables**
2. Update `NEXT_PUBLIC_API_URL` with actual API domain
3. Redeploy

---

## Step 5: Auto-Deploy from GitHub

### Enable Auto-Deploy
1. Go to **Settings** for each app
2. Find **Webhooks** section
3. Enable **Auto-deploy** option
4. Save

Now every `git push` triggers automatic deployment.

### Manual Deploy Webhook (Alternative)
1. Go to app → **Settings** → **Webhooks**
2. Copy **Deploy Webhook URL**
3. Go to GitHub → **Settings** → **Webhooks** → **Add webhook**
4. Paste URL → Select **Just the push event**

---

## Step 6: Connect Existing PostgreSQL

### Get PostgreSQL Connection from Coolify
1. Go to your PostgreSQL resource in Coolify
2. Copy the **Connection URL**
3. Update `DATABASE_URL` in API app's environment variables

### Format
```
postgresql://username:password@host:port/database
```

---

## Step 7: Connect Existing Redis

### Get Redis Connection from Coolify
1. Go to your Redis resource in Coolify
2. Get the **Host IP** and **Port**
3. Update API environment variables:
   - `REDIS_HOST` = Redis host IP
   - `REDIS_PORT` = 6379

---

## Quick Checklist

- [ ] GitHub source connected
- [ ] API app created with `api-runner` target
- [ ] API environment variables configured
- [ ] API health check enabled
- [ ] Admin app created with `admin-runner` target
- [ ] Admin environment variables configured
- [ ] Admin health check enabled
- [ ] PostgreSQL connected
- [ ] Redis connected
- [ ] Domains configured (optional)
- [ ] Auto-deploy enabled

---

## Troubleshooting

### Build Failed
- Check `pnpm-lock.yaml` is committed
- Verify Dockerfile path is correct
- Check build logs in Coolify

### API Not Starting
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is accessible
- Check Redis is running

### CORS Errors
- Set `CORS_ORIGIN` to exact frontend URL
- Include protocol (https://)

### Health Check Failing
- Check if app is listening on correct port
- Verify health endpoint returns 200

---

## Summary

| App | Build Target | Port | GitHub Connect |
|-----|-------------|------|---------------|
| API | `api-runner` | 4000 | ✅ Yes |
| Admin | `admin-runner` | 3000 | ✅ Yes |

Both apps connect to GitHub and auto-deploy on push.