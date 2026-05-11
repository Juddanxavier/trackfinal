import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createCsrfMiddleware } from '@csrf-armor/nextjs';

const csrfProtect = createCsrfMiddleware({
  strategy: 'signed-double-submit',
  secret: process.env.CSRF_SECRET || 'dev-secret-min-32-chars-long-here!!!',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: false,
    path: '/',
  },
  excludePaths: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/customer-register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/webhook',
    '/_next',
    '/favicon.ico',
  ],
});

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const result = await csrfProtect(request, response);

  if (!result.success) {
    console.warn('CSRF validation failed:', result.reason);
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  return result.response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};