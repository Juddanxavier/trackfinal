import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const isDev = process.env.NODE_ENV === 'development';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  if (isDev) console.log(...args);
}

const DEFAULT_TIMEOUT = 10000;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

const TOKEN_KEY = 'track_access_token';
const REFRESH_TOKEN_KEY = 'track_refresh_token';
const CSRF_TOKEN_KEY = 'csrf_token';

// CSRF Token management
let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf/token`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
  } catch (error) {
    console.error('[API] Failed to fetch CSRF token:', error);
  }
  return null;
}

// Simple token storage - always read from localStorage directly
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions extends RequestInit {
  throwOnError?: boolean;
  timeout?: number;
}

let refreshPromise: Promise<string> | null = null;
const listeners: Set<() => void> = new Set();

export function notifyAuthChange() {
  listeners.forEach(cb => cb());
}

export function subscribeAuthChange(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getUrl(path: string): string {
    const prefix = path.startsWith('/') ? '' : '/';
    const url = `${this.baseUrl}${prefix}${path}`;
    
    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      console.error(`[API] Invalid URL constructed: ${url}`);
      throw new Error(`Invalid API URL: ${url}`);
    }
    
    return url;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      log(`[API] Making request to: ${url}`, { method: options.method || 'GET' });
      const response = await fetch(url, { ...options, signal: controller.signal });
      log(`[API] Response from ${url}:`, response.status);
      return response;
    } catch (error) {
      console.error(`[API] Fetch failed for ${url}:`, error);
      // Re-throw with more context
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        if (error.message.includes('fetch')) {
          throw new Error(`Network error: Cannot connect to ${url}. Is the API server running?`);
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        log('[API] Attempting token refresh...');
        const storedRefreshToken = getRefreshToken();
        const body = storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined;

        const res = await this.fetchWithTimeout(
          this.getUrl('auth/refresh'),
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
          },
          DEFAULT_TIMEOUT
        );

        if (!res.ok) {
          console.error('[API] Token refresh failed:', res.status);
          setToken(null);
          setRefreshToken(null);
          notifyAuthChange();
          throw new ApiError('Session expired', 401);
        }

        const data = await res.json();
        setToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        notifyAuthChange();
        log('[API] Token refresh successful');
        return data.accessToken;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async fetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { throwOnError = true, timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    let hasRetried = false;

    // Validate path
    if (!path) {
      console.error('[API] Error: path is empty or undefined');
      if (!throwOnError) return {} as T;
      throw new ApiError('Request path is empty', 400);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Always get fresh token from localStorage
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for mutating operations
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(fetchOptions.method || 'GET') && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    let res: Response;
    try {
      const url = this.getUrl(path);
      log(`[API] Fetching: ${url}`, {
        method: fetchOptions.method || 'GET',
        hasAuth: !!token,
        path: path
      });
      res = await this.fetchWithTimeout(
        url,
        { ...fetchOptions, credentials: 'include', headers },
        timeout
      );
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }
      console.error(`[API] Fetch failed for ${path}:`, e);
      throw new ApiError(e instanceof Error ? e.message : 'Network error', 0);
    }

    // Handle 403 CSRF errors - fetch new CSRF token and retry
    if (res.status === 403 && !hasRetried) {
      const errorData = await res.json().catch(() => ({}));
      if (errorData.message?.includes('CSRF') || errorData.error?.includes('CSRF')) {
        log('[API] Got 403 CSRF error, fetching new token...');
        hasRetried = true;
        const newCsrfToken = await fetchCsrfToken();
        if (newCsrfToken) {
          headers['X-CSRF-Token'] = newCsrfToken;
          res = await this.fetchWithTimeout(
            this.getUrl(path),
            { ...fetchOptions, credentials: 'include', headers },
            timeout
          );
        }
      }
    }

    // Handle 401 - try to refresh token (skip for public auth endpoints)
    const isAuthEndpoint = path.includes('auth/login') || path.includes('auth/refresh') || path.includes('auth/register');
    if (res.status === 401 && !hasRetried && !isAuthEndpoint) {
      log('[API] Got 401, attempting token refresh...');
      hasRetried = true;
      try {
        const newToken = await this.refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await this.fetchWithTimeout(
          this.getUrl(path),
          { ...fetchOptions, credentials: 'include', headers },
          timeout
        );
        log('[API] Retry after refresh successful:', res.status);
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        setToken(null);
        notifyAuthChange();
        if (typeof window !== 'undefined' && throwOnError) {
          window.location.href = '/login';
        }
        throw new ApiError('Session expired', 401);
      }
    }

    if (!res.ok) {
      let message = 'An error occurred';
      try {
        const errorData = await res.json();
        message = errorData.message || `Request failed with status ${res.status}`;
      } catch {
        message = `Request failed with status ${res.status}`;
      }
      
      if (!throwOnError) {
        // Return error response as object for non-throwing calls
        return { 
          statusCode: res.status, 
          message,
          error: true 
        } as unknown as T;
      }
      throw new ApiError(message, res.status);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return res.json() as T;
  }

  async get<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

export async function logout() {
  try {
    await api.post('auth/logout');
  } finally {
    setToken(null);
    setRefreshToken(null);
    notifyAuthChange();
  }
}

export async function login(email: string, password: string) {
  const data = await api.post<{ accessToken: string; refreshToken?: string; user: AuthUser; requiresTwoFactor?: boolean; sessionToken?: string }>('auth/login', { email, password });
  if (data.requiresTwoFactor) {
    return { requiresTwoFactor: true as const, sessionToken: data.sessionToken! };
  }
  setToken(data.accessToken);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  notifyAuthChange();
  return data.user;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organisationId: string | null;
  branchId: string | null;
  emailVerified: boolean;
  avatar: string;
  phoneNumber?: string;
  permissions?: Record<string, string[]>;
}

export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<any>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email,
      role: decoded.role,
      organisationId: decoded.organisationId,
      branchId: decoded.branchId || null,
      emailVerified: decoded.email_verified || true,
      avatar: '',
    };
  } catch {
    return null;
  }
}

export function hasValidSession(): boolean {
  return !!getToken();
}

export async function restoreSession(): Promise<AuthUser | null> {
  // Check if we have a token
  const token = getToken();
  if (!token) {
    log('[Auth] No token to restore');
    return null;
  }

  // Try to validate token by calling auth/me
  try {
    log('[Auth] Validating token with auth/me...');
    const user = await api.get<AuthUser>('auth/me');
    log('[Auth] Token valid, user:', user.email);
    return user;
  } catch (error) {
    log('[Auth] Token validation failed, trying refresh...');
    
    // Token might be expired, try to refresh
    try {
      const storedRefreshToken = getRefreshToken();
      
      const refreshBody = storedRefreshToken 
        ? { refreshToken: storedRefreshToken }
        : undefined;
      
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: refreshBody ? JSON.stringify(refreshBody) : undefined,
      });

      if (!res.ok) {
        log('[Auth] Refresh failed, clearing session');
        setToken(null);
        return null;
      }

      const data = await res.json();
      setToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      log('[Auth] Refresh successful');
      
      // Get user info with new token
      const user = await api.get<AuthUser>('auth/me');
      return user;
    } catch (refreshError) {
      console.error('[Auth] Refresh error:', refreshError);
      setToken(null);
      return null;
    }
  }
}
