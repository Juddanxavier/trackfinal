import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/profile', '/shipments', '/quotes', '/onboarding'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  if (isProtected) {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\..*).*)',
  ],
};
