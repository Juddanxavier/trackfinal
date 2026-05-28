import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Empty middleware — placeholder for future auth checks or header injection.
// Currently passes all requests through unmodified.
export default function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
