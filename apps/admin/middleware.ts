import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Skip auth check in middleware - let frontend handle it
  // Cookie check disabled for now

  if (pathname === '/login' || pathname === '/register') {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Let frontend handle auth - allow all requests through
  const nextResponse = NextResponse.next();
  return addSecurityHeaders(nextResponse);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
