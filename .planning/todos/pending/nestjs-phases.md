---
title: NestJS Next Phase - Email Notifications with BullMQ
date: 2026-04-19
priority: high
status: completed
---

# NestJS Next Phase - Email Notifications ✅

## Implemented

### Phase 14: Email Notifications ✅

#### 14.1 SMTP Configuration (.env)
- [x] `SMTP_HOST` - SMTP server hostname
- [x] `SMTP_PORT` - SMTP port (587 or 465)
- [x] `SMTP_USER` - SMTP username
- [x] `SMTP_PASS` - SMTP password
- [x] `SMTP_FROM` - From email address
- [x] `FRONTEND_URL` - Frontend URL for links
- [x] `REDIS_HOST` / `REDIS_PORT` - For BullMQ queue

#### 14.2 Email Templates
- [x] Verification email - HTML with verify button
- [x] Password reset email - HTML with reset button
- [x] Welcome email - HTML welcome message

#### 14.3 BullMQ Queue
- [x] Redis-based job queue for email processing
- [x] Automatic retry with exponential backoff (3 attempts)
- [x] Async email sending (non-blocking)

#### 14.4 Integration
- [x] Uses `nodemailer` with SMTP
- [x] Uses `bullmq` for async job queue
- [x] Welcome email sent on registration
- [x] Falls back to logging when no SMTP configured (dev mode)
- [x] HTML templates with inline styles

---

## Usage

1. Start Redis: `docker run -p 6379:6379 redis`

2. Set SMTP credentials in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Track <noreply@track.com>
FRONTEND_URL=http://localhost:3001
```

3. Restart server

---

## Created Files
```
backend/src/modules/email/
├── email.module.ts          # Email module
├── email-queue.service.ts   # BullMQ queue service
```