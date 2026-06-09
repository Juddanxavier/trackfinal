import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/",
  "/_next/",
  "/favicon.ico",
]

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get("track_session")?.value
  const hasSession = refreshToken === "1"

  if (pathname === "/login" || pathname === "/register") {
    if (hasSession) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url))
      return addSecurityHeaders(response)
    }
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const response = NextResponse.redirect(loginUrl)
    return addSecurityHeaders(response)
  }

  const nextResponse = NextResponse.next()
  return addSecurityHeaders(nextResponse)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
