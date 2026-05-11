# Deployment Guide

This guide covers deploying the GT Express platform to production.

## 📋 Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Configure CORS origins for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable database SSL
- [ ] Set Redis password

### Environment
- [ ] Update all environment variables
- [ ] Configure production SMTP server
- [ ] Set up Sentry DSN for error tracking
- [ ] Configure 17Track API key
- [ ] Set up Google OAuth credentials (if using)

### Resources
- [ ] Provision PostgreSQL database
- [ ] Provision Redis instance
- [ ] Set up CDN for static assets (optional)
- [ ] Configure backup strategy

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/gtexpress/track.git
cd track

# Create production environment file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@db:5432/gtexpress

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# 17Track
TRACK17_API_KEY=your-17track-api-key

# Sentry
SENTRY_DSN=https://your-sentry-dsn

# Frontend URL
FRONTEND_URL=https://admin.yourdomain.com
EOF
```

#### 3. Deploy

```bash
# Start all services
docker-compose -f docker-compose.coolify.yml up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f admin

# Run database migrations
docker-compose exec backend pnpm db:migrate
```

#### 4. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/gtexpress
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/gtexpress /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Coolify (PaaS)

1. **Install Coolify** on your server
2. **Connect your GitHub repository**
3. **Configure environment variables** in Coolify dashboard
4. **Deploy** with zero-downtime

See `docker-compose.coolify.yml` for configuration.

### Option 3: Railway/Render (Cloud)

1. **Connect GitHub repo** to Railway/Render
2. **Set environment variables** in dashboard
3. **Deploy automatically** on push to main

## 🔧 Post-Deployment

### 1. Health Checks

```bash
# API Health
curl https://api.yourdomain.com/api/health

# Database connectivity
curl https://api.yourdomain.com/api/health/db

# Check all circuit breakers
curl -H "Authorization: Bearer <token>" \
  https://api.yourdomain.com/api/monitoring/circuit-breakers
```

### 2. Database Backups

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="gtexpress_backup_$DATE.sql"

# Create backup
docker-compose exec -T db pg_dump \
  -U postgres \
  gtexpress > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://your-backup-bucket/

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup-script.sh
```

### 3. Monitoring Setup

#### Sentry Integration

Already configured. Just set the `SENTRY_DSN` environment variable.

#### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Configure checks for:
- https://api.yourdomain.com/api/health
- https://admin.yourdomain.com

### 4. SSL Certificate Renewal

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com

# Auto-renewal is configured automatically
```

## 🔄 Updates

### Rolling Updates (Zero Downtime)

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.coolify.yml up -d --build

# Run migrations
docker-compose exec backend pnpm db:migrate

# Check status
docker-compose ps
```

### Database Migrations

```bash
# Check pending migrations
docker-compose exec backend pnpm db:check

# Run migrations
docker-compose exec backend pnpm db:migrate

# Rollback (if needed)
docker-compose exec backend pnpm db:rollback
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check for port conflicts
sudo netstat -tulpn | grep :4000

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Test connection from container
docker-compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Check if database is running
docker-compose ps db
```

### Memory Issues

```bash
# Check memory usage
docker stats

# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📊 Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy
2. **Database**: Move to managed PostgreSQL (AWS RDS, DigitalOcean)
3. **Redis**: Use Redis Cluster or managed Redis
4. **Stateless**: Ensure API is stateless (✅ already done)

### Vertical Scaling

Increase container resources:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## 🔒 Security Hardening

### 1. Fail2Ban

```bash
sudo apt install fail2ban

# Configure for API
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[api-auth]
enabled = true
port = http,https
filter = api-auth
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
EOF
```

### 2. Firewall

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Regular Updates

```bash
# Automated security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Review [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub

---

**Last Updated**: 2026-05-11
