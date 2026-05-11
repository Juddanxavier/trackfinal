# GT Express - Shipment Tracking Platform

[![Build Status](https://github.com/gtexpress/track/workflows/Build%20Verification/badge.svg)](https://github.com/gtexpress/track/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready shipment tracking platform built with Next.js, NestJS, and PostgreSQL.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture** - Support for multiple organisations
- **Real-time Tracking** - Integration with 17Track API
- **Role-based Access** - Admin, Staff, and Customer roles
- **Notification System** - Email, WhatsApp, and in-app notifications
- **Analytics Dashboard** - Visual insights into shipments and performance

### Security Features
- ✅ JWT Authentication with Refresh Tokens
- ✅ CSRF Protection
- ✅ Role-based Access Control (RBAC)
- ✅ Rate Limiting
- ✅ Input Validation & Sanitization
- ✅ Circuit Breaker Pattern for External APIs

### Performance Features
- ✅ Redis Caching Layer
- ✅ BullMQ Job Queue
- ✅ Database Query Optimization
- ✅ CDN Ready

## 📦 Project Structure

```
track/
├── apps/
│   ├── admin/          # Next.js Admin Dashboard
│   ├── api/            # NestJS API Server
│   └── gajantraders/   # Public Tracking Website
├── packages/
│   ├── auth/           # Shared Auth Utilities
│   ├── config/         # Shared Configurations
│   ├── ui/             # Shared UI Components
│   └── utils/          # Shared Utilities
└── docker-compose.yml  # Docker orchestration
```

## 🛠️ Tech Stack

### Frontend (Admin)
- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Hooks
- **Animations**: Framer Motion
- **Charts**: Recharts

### Backend (API)
- **Framework**: NestJS
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with Redis
- **Cache**: Redis
- **Auth**: Passport.js + JWT

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Error Tracking**: Sentry
- **Monitoring**: Built-in health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### 1. Clone the Repository

```bash
git clone https://github.com/gtexpress/track.git
cd track
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.local.example apps/admin/.env.local

# Edit the environment files with your configuration
```

### 4. Database Setup

```bash
# Run database migrations
cd apps/api
pnpm db:migrate

# (Optional) Seed the database
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually:
# API Server
pnpm --filter=api dev

# Admin Dashboard
pnpm --filter=admin dev
```

### 6. Access the Applications

- **Admin Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:4000/api/docs
- **API Base URL**: http://localhost:4000/api

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run API tests
pnpm --filter=api test
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm --filter=admin exec playwright install

# Run E2E tests
pnpm --filter=admin test:e2e
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Or use the production compose file
docker-compose -f docker-compose.coolify.yml up -d
```

### Environment Variables

#### API Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_HOST` | Redis server host | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ |
| `SMTP_HOST` | SMTP server host | ⚠️ |
| `TRACK17_API_KEY` | 17Track API key | ⚠️ |

See `apps/api/.env.example` for complete list.

#### Admin App (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | API base URL | ✅ |

## 📚 API Documentation

API documentation is available via Swagger UI at:
- **Development**: http://localhost:4000/api/docs
- **Production**: https://api.yourdomain.com/api/docs

### Authentication

All API endpoints (except public ones) require authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `GET /api/shipments` - List shipments
- `POST /api/shipments` - Create shipment
- `GET /api/tracking/quota` - Check tracking API quota

## 🔒 Security

### Production Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Configure SMTP credentials
- [ ] Enable Sentry error tracking
- [ ] Set up rate limiting
- [ ] Configure Redis password
- [ ] Enable database SSL

## 🏗️ Architecture

### Authentication Flow

```
┌──────────┐     Login      ┌─────────┐     JWT      ┌──────────┐
│  Client  │ ─────────────> │   API   │ ───────────> │  Client  │
└──────────┘                └─────────┘              └──────────┘
     │                           │                         │
     │                     Refresh Token                   │
     │ <────────────────────────────────────────────────── │
     │                           │                         │
     │                      Access Token                   │
     │ <────────────────────────────────────────────────── │
```

### Circuit Breaker Pattern

External API calls (17Track) are protected by circuit breakers:

- **CLOSED**: Normal operation
- **OPEN**: Failing, rejecting requests (1 min timeout)
- **HALF_OPEN**: Testing if recovered

### Caching Strategy

- **API Responses**: 5-minute cache for stats endpoints
- **Session Store**: Redis for JWT refresh tokens
- **Job Queue**: BullMQ for background processing

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify connection string format
postgresql://user:password@localhost:5432/dbname
```

#### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

#### 401 Unauthorized Errors

- Check JWT token is valid
- Verify `Authorization` header format
- Check CSRF token for mutating operations

#### Circuit Breaker Open

If external APIs (17Track) are failing:
- Check API quota limits
- Verify API key is valid
- Monitor circuit breaker status at `/api/monitoring/circuit-breakers`

## 📈 Monitoring

### Health Checks

- API Health: `GET /api/health`
- Database: Check connection pool
- Redis: Check connection

### Circuit Breaker Metrics

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/monitoring/circuit-breakers
```

### Error Tracking

Errors are automatically tracked in Sentry (if configured).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/gtexpress/track/issues)
- **Documentation**: [Wiki](https://github.com/gtexpress/track/wiki)
- **Email**: support@gtexpress.com

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [17Track](https://www.17track.net/) - Tracking API provider

---

Built with ❤️ by GT Express Team
