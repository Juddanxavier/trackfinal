const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const DEFAULT_TIMEOUT = 10000;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

const AUTH_STATE_KEY = '__track_auth_state';
const TOKEN_KEY = 'access_token';

function getGlobalAuthState(): { accessToken: string | null; expiresAt: number | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, expiresAt: null };
  }
  if (!(window as any)[AUTH_STATE_KEY]) {
    let storedToken: string | null = null;
    try {
      storedToken = localStorage.getItem(TOKEN_KEY);
    } catch {}
    (window as any)[AUTH_STATE_KEY] = { accessToken: storedToken, expiresAt: null };
  }
  return (window as any)[AUTH_STATE_KEY];
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
let refreshChannel: BroadcastChannel | null = null;

const listeners: Set<() => void> = new Set();

function notifyAuthChange() {
  listeners.forEach(cb => cb());
}

export function subscribeAuthChange(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setAccessToken(token: string | null, expiresInSeconds?: number) {
  const state = getGlobalAuthState();
  state.accessToken = token;
  state.expiresAt = expiresInSeconds
    ? Date.now() + expiresInSeconds * 1000 - TOKEN_EXPIRY_BUFFER_MS
    : null;
  
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  }
  
  notifyAuthChange();
}

export function clearAuth() {
  const state = getGlobalAuthState();
  state.accessToken = null;
  state.expiresAt = null;
  notifyAuthChange();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('selectedOrganisationId');
    } catch {}
  }
}

export function hasValidSession(): boolean {
  return !!getGlobalAuthState().accessToken;
}

function initBroadcastChannel() {
  if (typeof window === 'undefined') return;
  
  if (refreshChannel) return;
  
  try {
    refreshChannel = new BroadcastChannel('auth-logout');
    refreshChannel.onmessage = (event) => {
      if (event.data === 'logout') {
        clearAuth();
        window.location.href = '/login';
      }
    };
  } catch {
    // BroadcastChannel not supported
  }
}

function broadcastLogout() {
  if (refreshChannel) {
    refreshChannel.postMessage('logout');
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getUrl(path: string): string {
    const prefix = path.startsWith('/') ? '' : '/';
    return `${this.baseUrl}${prefix}${path}`;
  }

  private sanitizeError(message: string, statusCode?: number): string {
    if (statusCode === 401) return 'Session expired - please log in again';
    if (statusCode === 403) return 'Access denied';
    if (statusCode === 404) return 'Resource not found';
    if (statusCode === 422 || statusCode === 400) {
      return message.includes('validation') ? 'Invalid input' : message;
    }
    if (statusCode && statusCode >= 500) return `Server error (${statusCode})`;

    const lower = message.toLowerCase();
    if (lower.includes('permission') || lower.includes('denied') || lower.includes('forbidden')) {
      return 'Access denied';
    }
    if (lower.includes('not found')) return 'Resource not found';
    if (lower.includes('validation')) return 'Invalid input';

    return message.length > 5 && message.length < 100 ? message : 'Something went wrong';
  }

  private getAuthHeader(): string | null {
    const token = getGlobalAuthState().accessToken;
    if (token) {
      return `Bearer ${token}`;
    }
    return null;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
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
        const res = await this.fetchWithTimeout(
          this.getUrl('auth/refresh'),
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          },
          DEFAULT_TIMEOUT
        );

        if (!res.ok) {
          clearAuth();
          throw new ApiError('Session expired', 401);
        }

        const data = await res.json();
        setAccessToken(data.accessToken);
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let res: Response;
    try {
      res = await this.fetchWithTimeout(
        this.getUrl(path),
        { ...fetchOptions, credentials: 'include', headers },
        timeout
      );
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }
      throw e;
    }

    if (res.status === 401 && !hasRetried && authHeader) {
      hasRetried = true;
      try {
        const newToken = await this.refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await this.fetchWithTimeout(
          this.getUrl(path),
          { ...fetchOptions, credentials: 'include', headers },
          timeout
        );
      } catch {
        clearAuth();
        if (typeof window !== 'undefined' && throwOnError) {
          window.location.href = '/login';
        }
        throw new ApiError('Session expired', 401);
      }
    }

    if (!res.ok) {
      if (!throwOnError) return {} as T;
      let message = 'An error occurred';
      try {
        const errorData = await res.json();
        message = errorData.message || `Request failed with status ${res.status}`;
      } catch {
        message = `Request failed with status ${res.status}`;
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
    clearAuth();
    broadcastLogout();
  }
}

export async function login(email: string, password: string) {
  initBroadcastChannel();
  
  const data = await api.post<{ accessToken: string; user: AuthUser }>('auth/login', { email, password });
  setAccessToken(data.accessToken);
  
  return data.user;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organisationId: string | null;
  emailVerified: boolean;
  avatar: string;
}

export async function getMe(): Promise<AuthUser | null> {
  return api.get<AuthUser>('auth/me');
}

export async function restoreSession(): Promise<AuthUser | null> {
  // First try localStorage token
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setAccessToken(storedToken);
      const user = await api.get<AuthUser>('auth/me');
      if (user) return user;
    }
  } catch {}

  // Fall back to cookie-based refresh
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    
    const user = await api.get<AuthUser>('auth/me');
    return user;
  } catch {
    clearAuth();
    return null;
  }
}
