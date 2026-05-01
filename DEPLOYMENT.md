# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start

### 1. Clone and configure

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your production values
```

### 2. Generate secrets

```bash
# JWT secrets (run in backend directory)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

### 3. Build and run

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 for STARTTLS, 465 for SSL) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | `production` for production |
| `PORT` | 4000 | Backend port |
| `FRONTEND_URL` | http://localhost:3000 | Public URL |
| `SENTRY_DSN` | - | Sentry error tracking |
| `THROTTLE_LIMIT` | 100 | Max requests per minute |
| `BCRYPT_ROUNDS` | 12 | Password hashing rounds |

## Services

| Service | Port | Description |
|---------|------|-------------|
| Admin (Next.js) | 3000 | Frontend application |
| Backend (NestJS) | 4000 | API server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Queue |
| Swagger Docs | 4000/docs | API documentation |

## Production Checklist

- [ ] Change all default secrets
- [ ] Configure SMTP credentials
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to your domain
- [ ] Configure `SENTRY_DSN` for error tracking
- [ ] Set up SSL/TLS (HTTPS)
- [ ] Update CORS origins
- [ ] Review rate limiting settings
- [ ] Set up monitoring/alerting

## Common Commands

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend

# Run migrations (if applicable)
docker-compose exec backend npm run migration:run

# Scale backend
docker-compose up -d --scale backend=2

# Stop and remove
docker-compose down -v
```

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
netstat -an | grep 4000

# Check logs
docker-compose logs backend
```

### Database connection failed
```bash
# Check postgres is running
docker-compose ps postgres

# Test connection
docker-compose exec backend nc -zv postgres 5432
```

### Emails not sending
```bash
# Verify SMTP settings in .env
docker-compose exec backend env | grep SMTP
```

## Scaling

For horizontal scaling:
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

Use Redis for session storage when scaling horizontally.