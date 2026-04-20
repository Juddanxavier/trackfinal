---
phase: admin-app-review
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - admin/middleware.ts
  - admin/lib/api.ts
  - admin/lib/utils.ts
  - admin/app/page.tsx
  - admin/app/layout.tsx
  - admin/app/login/page.tsx
  - admin/app/(protected)/layout.tsx
  - admin/app/(protected)/dashboard/page.tsx
  - admin/components/theme-provider.tsx
  - admin/components/ui/button.tsx
  - admin/components/ui/card.tsx
  - admin/components/ui/input.tsx
  - admin/components/ui/label.tsx
  - admin/next.config.mjs
  - admin/.env.local
findings:
  critical: 2
  warning: 7
  info: 5
  total: 14
status: issues_found
---

# Admin App Code Review Report

**Reviewed:** 2026-04-20
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This review analyzed 15 source files in the Next.js admin application. The codebase includes authentication middleware, an API client, login page, dashboard, and UI components. Several security vulnerabilities and code quality issues were identified that should be addressed.

The most critical issues are an **open redirect vulnerability** in the login page and **missing security headers** in middleware. Additionally, there are concerns around mutable global state in the API client and poor error handling patterns.

---

## Critical Issues

### CR-01: Open Redirect Vulnerability in Login Page

**File:** `admin/app/login/page.tsx:25`
**Issue:** The `redirect` parameter from URL query strings is used directly without validation. An attacker could craft a malicious URL like `https://admin.example.com/login?redirect=https://evil.com/phishing` to redirect users to a malicious site after authentication.

**Fix:**
```typescript
// Add validation for redirect URL
const redirect = searchParams.get('redirect') || '/dashboard';

// Only allow same-origin redirects
if (redirect && !redirect.startsWith('/')) {
  redirect = '/dashboard';
}
```

### CR-02: Missing Security Headers in Middleware

**File:** `admin/middleware.ts:13-47`
**Issue:** The authentication middleware does not set critical security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security). Without these headers, the application is vulnerable to XSS, clickjacking, and MIME sniffing attacks.

**Fix:**
```typescript
// In the middleware response, add security headers
const response = NextResponse.next();
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
return response;
```

---

## Warnings

### WR-01: Mutable Global State in API Client

**File:** `admin/lib/api.ts:17-18, 24-26, 44-50`
**Issue:** The API client uses module-level mutable variables (`csrfToken` and `accessToken`) to store authentication state. This pattern can cause race conditions in concurrent requests and makes the state difficult to track and debug.

**Fix:** Consider using a React context or a proper state management solution instead of module-level variables. If keeping the current approach, add proper locking/synchronization for concurrent access.

### WR-02: No Request Timeout on Auth Check

**File:** `admin/middleware.ts:26-34`
**Issue:** The fetch call to verify authentication has no timeout. If the API server is slow or unavailable, the request could hang indefinitely, causing pages to never load.

**Fix:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

const response = await fetch(`${apiUrl}/auth/check`, {
  method: 'GET',
  credentials: 'include',
  headers: { 
    'Content-Type': 'application/json',
    'Cookie': request.headers.get('cookie') || '',
  },
  redirect: 'manual',
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

### WR-03: Silent Error Swallowing in Logout

**File:** `admin/app/(protected)/dashboard/page.tsx:22-29`
**Issue:** The logout function has an empty catch block that silently swallows any errors. If the logout API call fails, the user is still redirected to the login page, potentially leaving them logged in on the server side.

**Fix:**
```typescript
const handleLogout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    // Optionally notify user of logout failure
  } finally {
    clearAuth();
    router.push('/login');
  }
};
```

### WR-04: Direct DOM Manipulation in Login Form

**File:** `admin/app/login/page.tsx:67-68`
**Issue:** Uses `document.getElementById` to retrieve the email value instead of using React form state. This is an anti-pattern that bypasses React's reconciliation and can lead to stale data issues.

**Fix:** Use the form values from react-hook-form:
```typescript
// Get email from form data in onSubmit instead
const onSubmit = async (data: LoginFormData) => {
  const email = data.email;
  // Use email directly
};
```

### WR-05: Using Browser Alert for User Feedback

**File:** `admin/app/login/page.tsx:71, 77, 79`
**Issue:** Uses browser `alert()` for error and success messages instead of proper UI feedback. This is poor UX and indicates improper handling of form state for forgot password flow.

**Fix:** Use React state to display inline messages:
```typescript
const [forgotPasswordStatus, setForgotPasswordStatus] = useState<string | null>(null);

const handleForgotPassword = async (e: React.MouseEvent) => {
  e.preventDefault();
  const email = watch('email'); // Use react-hook-form's watch
  
  if (!email) {
    setForgotPasswordStatus('Please enter your email address first');
    return;
  }
  
  try {
    await api.post('/auth/forgot-password', { email });
    setForgotPasswordStatus('If the email exists, a reset link will be sent');
  } catch {
    setForgotPasswordStatus('If the email exists, a reset link will be sent');
  }
};
```

### WR-06: Full Page Reload for Navigation

**File:** `admin/app/login/page.tsx:45` and `admin/app/(protected)/dashboard/page.tsx:28`
**Issue:** Uses `window.location.href` for navigation which causes a full page reload. This defeats the purpose of using Next.js and SPA architecture.

**Fix:** Use Next.js router:
```typescript
// In login page
import { useRouter } from 'next/navigation';
const router = useRouter();
// ...
router.push(redirect);

// In dashboard
import { useRouter } from 'next/navigation';
const router = useRouter();
// ...
router.push('/login');
```

### WR-07: Email Enumeration on Forgot Password

**File:** `admin/app/login/page.tsx:75-80`
**Issue:** The forgot password endpoint behavior could reveal whether an email exists in the system. Different error messages for existing vs. non-existing emails allow attackers to enumerate valid user accounts.

**Fix:** Always return the same message regardless of whether the email exists:
```typescript
// Current implementation already does this, but ensure backend follows same pattern
setForgotPasswordStatus('If the email exists, a reset link will be sent');
```

---

## Info

### IN-01: Leftover Template Code

**File:** `admin/app/page.tsx:1-19`
**Issue:** This is the default Next.js template page with no customization. It appears to be a placeholder that was never replaced with actual application functionality.

**Fix:** Either replace with actual application content or remove the page entirely if not needed.

### IN-02: Protected Layout is Empty

**File:** `admin/app/(protected)/layout.tsx:1-3`
**Issue:** The protected layout component only wraps children without any additional functionality. This could be intentional for organization, but adds unnecessary nesting.

**Fix:** If no additional layout functionality is needed, remove this route group and use the dashboard page directly.

### IN-03: No Timeout on API Client Fetch

**File:** `admin/lib/api.ts:102`
**Issue:** The API client's fetch method doesn't include request timeouts, similar to the middleware issue. Long-running requests could hang indefinitely.

**Fix:** Add AbortController timeout to the fetch call in the ApiClient.

### IN-04: Potential Race Condition in getCsrfToken

**File:** `admin/lib/api.ts:28-41`
**Issue:** If multiple calls to `getCsrfToken()` happen concurrently before the first resolves, multiple requests could be made simultaneously, each setting and overwriting the token.

**Fix:**
```typescript
let csrfTokenPromise: Promise<string | null> | null = null;

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (csrfTokenPromise) return csrfTokenPromise;
  
  csrfTokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: 'include',
      });
      const data = await res.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    } finally {
      csrfTokenPromise = null;
    }
  })();
  
  return csrfTokenPromise;
}
```

### IN-05: CSRF Token Not Validated on Response

**File:** `admin/lib/api.ts:108-123`
**Issue:** When receiving API responses, the client doesn't validate CSRF tokens in response headers. This leaves a gap in CSRF protection.

**Fix:** Consider adding CSRF token validation for state-changing operations based on server response headers.

---

_Reviewed: 2026-04-20_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
