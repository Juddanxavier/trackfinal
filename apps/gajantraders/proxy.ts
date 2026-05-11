import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: This middleware only handles basic path checks
// Actual auth validation happens client-side via ProtectedRoute component
// We cannot access localStorage from middleware, only cookies

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all paths - auth is handled client-side
  // This prevents hydration mismatches and redirect loops
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\..*).*)',
  ],
};