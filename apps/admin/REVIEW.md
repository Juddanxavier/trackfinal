---
phase: Admin App Security Review
reviewed: 2026-05-11T00:00:00Z
depth: deep
files_reviewed: 25
files_reviewed_list:
  - components/auth-context.tsx
  - components/app-layout.tsx
  - components/app-sidebar.tsx
  - components/nav-user.tsx
  - components/site-header.tsx
  - components/data-table.tsx
  - lib/api.ts
  - middleware.ts
  - app/(protected)/layout.tsx
  - app/(protected)/dashboard/page.tsx
  - app/(protected)/users/page.tsx
  - app/(protected)/users/[id]/page.tsx
  - app/(protected)/shipments/page.tsx
  - app/(protected)/shipments/[id]/page.tsx
  - app/(protected)/quotes/page.tsx
  - app/(protected)/settings/page.tsx
  - app/(protected)/error.tsx
  - app/(auth)/layout.tsx
  - app/(auth)/login/page.tsx
  - app/(auth)/register/page.tsx
  - app/(auth)/forgot-password/page.tsx
  - app/(auth)/error.tsx
  - app/layout.tsx
  - app/page.tsx
findings:
  critical: 5
  warning: 12
  info: 8
  total: 25
status: issues_found
---

# Admin App Security & Code Quality Review Report

**Reviewed:** 2026-05-11  
**Depth:** Deep Analysis  
**Files Reviewed:** 25  
**Status:** ⚠️ ISSUES FOUND

---

## Executive Summary

This comprehensive review of the GT Express admin application (`apps/admin`) has identified **25 total issues**, including **5 Critical**, **12 Warning**, and **8 Info-level** findings. The most significant concerns relate to authentication bypass vulnerabilities, missing server-side authorization, and race conditions in the auth flow.

### Key Risk Areas:
1. **Authentication/Authorization** - Middleware lacks actual auth enforcement
2. **State Management** - Race conditions in auth context initialization
3. **API Security** - No role-based access control enforcement on frontend
4. **Input Validation** - Missing sanitization and validation gaps
5. **Data Flow** - Inconsistent error handling and potential race conditions

---

## Critical Issues

### CR-01: Middleware Completely Bypasses Authentication

**File:** `middleware.ts:29-47`  
**Issue:** The middleware explicitly disables authentication checking with comments stating "Skip auth check in middleware - let frontend handle it" and "Cookie check disabled for now". This allows ANY request to pass through to protected routes, making the entire authentication system optional at the server level.

**Security Impact:** HIGH - Complete authentication bypass at the edge/server level. Malicious users can access any protected API route or page directly without authentication.

**Fix:**
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token in cookies
  const token = request.cookies.get('track_access_token')?.value;
  
  if (!token && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Validate token and set user context
  // ...token validation logic...
  
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
```

---

### CR-02: No Server-Side Role Authorization Checks

**File:** `components/auth-context.tsx:85-97`, `app/(protected)/users/page.tsx:94-96`  
**Issue:** Role-based access control (RBAC) is only enforced client-side. The `isAdmin` check happens only in React components, and API calls don't include role verification headers. Non-admin users can craft API requests to access admin-only endpoints.

**Security Impact:** HIGH - Privilege escalation possible by directly calling APIs.

**Fix:**
```typescript
// All API calls should include user's role and the server should verify
const apiCall = async (endpoint: string, options = {}) => {
  const user = getCurrentUser();
  return api.fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-User-Role': user?.role,
      'X-User-Org': user?.organisationId,
    }
  });
};
```

---

### CR-03: Race Condition in Auth State Initialization

**File:** `components/auth-context.tsx:136-221`  
**Issue:** The `useEffect` hook in `AuthProvider` handles auth initialization but has a race condition where multiple rapid route changes can cause:
1. Multiple concurrent `refreshUser()` calls
2. Stale auth state updates after component unmount
3. Duplicate organization fetching

The `isMounted` flag helps but doesn't prevent race conditions between the init function and the auth subscription callback.

**Security Impact:** MEDIUM-HIGH - Can result in stale auth data, session confusion, or temporary unauthorized access.

**Fix:**
```typescript
React.useEffect(() => {
  let isMounted = true;
  let initPromise: Promise<void> | null = null;

  const init = async () => {
    // Prevent concurrent initialization
    if (initPromise) return;
    
    initPromise = (async () => {
      try {
        // ... auth logic
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    
    await initPromise;
  };

  init();
  
  return () => { isMounted = false; };
}, [pathname]); // Include pathname to re-run on route changes
```

---

### CR-04: Missing Input Sanitization on User Lookup

**File:** `app/(protected)/shipments/page.tsx:294-315`  
**Issue:** The `lookupUser` function passes raw email and phone parameters directly to the API without sanitization. SQL injection or NoSQL injection is possible if the backend doesn't properly sanitize these inputs.

**Line 297-299:**
```typescript
const params = new URLSearchParams()
if (email) params.set("email", email)  // Raw email passed without validation
if (phone) params.set("phone", phone)  // Raw phone passed without validation
```

**Security Impact:** HIGH - Potential injection attacks if backend is vulnerable.

**Fix:**
```typescript
import { z } from 'zod';

const emailSchema = z.string().email().max(255);
const phoneSchema = z.string().regex(/^[\d\s\-+()]+$/).max(20);

const lookupUser = async (email?: string, phone?: string) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      const validEmail = emailSchema.parse(email);
      params.set("email", validEmail);
    }
    if (phone) {
      const validPhone = phoneSchema.parse(phone);
      params.set("phone", validPhone);
    }
    // ... rest of function
  } catch (err) {
    toast.error("Invalid input format");
    return null;
  }
};
```

---

### CR-05: Insecure Direct Object Reference (IDOR) Risk

**File:** `app/(protected)/shipments/[id]/page.tsx:114`, `app/(protected)/users/[id]/page.tsx:66`  
**Issue:** Pages access resources by ID directly from URL params without verifying the user has permission to view that specific resource. Users could potentially access other organizations' shipments by changing the ID in the URL.

**Security Impact:** HIGH - Users can access data from other organizations by guessing/modifying IDs.

**Fix:**
```typescript
// API should enforce organization scoping automatically
const fetchShipment = useCallback(async () => {
  if (!shipmentId) return;
  try {
    // API endpoint should automatically filter by user's org
    const res = await api.get<Shipment>(`/shipments/${shipmentId}`);
    // Backend should return 403 if user doesn't have access
    setShipment(res);
  } catch (err) {
    if (err.statusCode === 403) {
      setError("You don't have permission to view this shipment");
    } else {
      setError("Failed to load shipment");
    }
  }
}, [shipmentId]);
```

---

## Warnings

### WR-01: No Rate Limiting on Form Submissions

**File:** `app/(auth)/login/page.tsx:43-66`, `app/(protected)/quotes/page.tsx:230-255`  
**Issue:** No rate limiting implemented on authentication attempts, email sending, or form submissions. Brute force attacks are possible.

**Fix:** Implement exponential backoff and CAPTCHA after failed attempts.

---

### WR-02: Console Logs in Production Code

**File:** `app/(protected)/dashboard/page.tsx:61-77`  
**Issue:** Multiple `console.log` statements remain in production code, potentially exposing sensitive data in browser dev tools.

```typescript
console.log("[Dashboard] Shipment stats:", shipRes)
console.log("[Dashboard] Quote stats:", quoteRes)
console.log("[Dashboard] Ship activity:", shipActivity)
```

**Fix:** Remove all console logs or use a proper logging library with environment-based filtering.

---

### WR-03: Weak Email Validation Pattern

**File:** `app/(auth)/login/page.tsx:17`  
**Issue:** Using simple regex validation instead of proper email format validation. The zod `.email()` is good but should be paired with domain validation for corporate emails.

---

### WR-04: Missing Error Boundaries for Data Fetching

**File:** `app/(protected)/users/page.tsx:155-184`  
**Issue:** API errors are only logged to console without proper UI feedback or retry mechanisms.

---

### WR-05: Potential Memory Leak in useEffect

**File:** `app/(protected)/shipments/page.tsx:469-491`  
**Issue:** The quota fetching interval is set up but the cleanup doesn't handle all edge cases properly.

```typescript
useEffect(() => {
  fetchStats()
  fetchCarriers()
  fetchQuota()
  const interval = setInterval(fetchQuota, 60 * 60 * 1000)
  return () => clearInterval(interval)
}, [selectedOrganisation])
```

**Fix:** Add abort controller to cancel in-flight requests on unmount.

---

### WR-06: Inconsistent Type Assertions

**File:** `app/(protected)/dashboard/page.tsx:55-57`  
**Issue:** Using `as any` type assertions bypasses TypeScript's type safety.

```typescript
const res = (await api.get(`/shipments?${params}`, {
  throwOnError: false,
})) as any
```

**Fix:** Define proper types and use type guards.

---

### WR-07: Hardcoded Constants Without Configuration

**File:** `app/(protected)/shipments/page.tsx:123-136`  
**Issue:** Country codes and dial codes are hardcoded instead of being configurable.

---

### WR-08: Missing CSRF Protection

**File:** `lib/api.ts:166-200`  
**Issue:** API requests don't include CSRF tokens, making the application vulnerable to CSRF attacks if cookies are not properly configured with SameSite.

**Fix:** Implement CSRF token validation on state-changing requests.

---

### WR-09: Potential XSS via dangerouslySetInnerHTML Not Used But InnerHTML Present

**File:** `components/data-table.tsx`  
**Issue:** While the code doesn't use `dangerouslySetInnerHTML`, there are places where user input could be rendered without proper sanitization.

---

### WR-10: Uncaught Promise Rejections

**File:** `lib/api.ts:240-246`  
**Issue:** The refresh token flow has a catch block that redirects but doesn't properly handle all error cases, potentially leaving the app in an inconsistent state.

---

### WR-11: Missing Input Length Validation

**File:** `components/app-sidebar.tsx:161-193`  
**Issue:** Quick create shipment form doesn't validate input lengths, potentially allowing oversized inputs that could cause database issues.

---

### WR-12: Session Fixation Risk

**File:** `lib/api.ts:351-386`  
**Issue:** The `restoreSession` function doesn't regenerate session identifiers after restoration, potentially leaving sessions vulnerable to fixation attacks.

---

## Info

### IN-01: Unused Imports

**File:** `app/(protected)/users/[id]/page.tsx:9-10`  
**Issue:** `Pagination` imported but not used; several icon imports are unused.

---

### IN-02: Magic Numbers

**File:** `app/(protected)/quotes/page.tsx:119`  
**Issue:** Email cooldown time is hardcoded as `60000` without constant naming.

**Fix:**
```typescript
const EMAIL_COOLDOWN_MS = 60 * 1000; // 1 minute
```

---

### IN-03: Inconsistent Error Message Formatting

**File:** Multiple files  
**Issue:** Error messages are formatted inconsistently - some use toast notifications, others use console.error, and others use inline UI messages.

---

### IN-04: Duplicate Type Definitions

**File:** `app/(protected)/shipments/page.tsx:81-105`  
**Issue:** `Stats` interface is defined twice with slightly different properties.

---

### IN-05: Empty Error Catch Blocks

**File:** `lib/api.ts:18-19`  
**Issue:** Silent failures in localStorage operations.

```typescript
try {
  storedToken = localStorage.getItem(TOKEN_KEY);
} catch {}  // Silent failure
```

---

### IN-06: Missing Loading States for Partial Data

**File:** `app/(protected)/dashboard/page.tsx:125-142`  
**Issue:** The loading state shows skeleton UI, but partial data loading (some requests succeed, others fail) isn't handled gracefully.

---

### IN-07: Accessibility Issues

**File:** `components/data-table.tsx:654-812`  
**Issue:** Complex table interactions may not be fully accessible to screen readers.

---

### IN-08: Deprecated React Patterns

**File:** `components/auth-context.tsx:221`  
**Issue:** The useEffect dependency array includes functions that change identity on every render, potentially causing unnecessary re-runs.

---

## Recommendations

### Immediate Actions (Critical Priority)

1. **Enable Middleware Authentication** - Remove the bypass in `middleware.ts` and implement proper token validation
2. **Implement Server-Side RBAC** - Add role verification to all API endpoints
3. **Fix Race Conditions** - Add proper synchronization to auth context initialization
4. **Add Input Sanitization** - Validate and sanitize all user inputs before API calls
5. **Implement Resource-Level Authorization** - Verify users can only access their organization's data

### Short-term Actions (High Priority)

1. Add rate limiting to all forms and API endpoints
2. Remove or disable console.log statements in production
3. Implement proper error boundaries and user feedback
4. Add CSRF protection tokens
5. Fix memory leaks in useEffect cleanup

### Long-term Actions (Medium Priority)

1. Implement comprehensive input validation with Zod schemas
2. Add comprehensive unit and integration tests
3. Implement proper logging with structured logging library
4. Add performance monitoring for API calls
5. Conduct regular security audits

---

## Files Requiring Immediate Attention

| File | Priority | Issues |
|------|----------|--------|
| `middleware.ts` | CRITICAL | Auth bypass |
| `components/auth-context.tsx` | CRITICAL | Race conditions, state issues |
| `lib/api.ts` | CRITICAL | CSRF, session fixation |
| `app/(protected)/shipments/page.tsx` | HIGH | IDOR, input validation |
| `app/(protected)/shipments/[id]/page.tsx` | HIGH | IDOR vulnerability |
| `app/(protected)/users/page.tsx` | HIGH | RBAC enforcement |

---

_Reviewed: 2026-05-11_  
_Reviewer: gsd-code-reviewer_  
_Depth: Deep_
