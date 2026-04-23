const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const DEFAULT_TIMEOUT = 10000;

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

interface AuthTokens {
  accessToken: string | null;
}

let tokens: AuthTokens = {
  accessToken: null,
};

let refreshPromise: Promise<string> | null = null;

const listeners: Set<() => void> = new Set();

export function subscribeAuthChange(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAuthChange() {
  listeners.forEach(cb => cb());
}

export function getAccessToken(): string | null {
  return tokens.accessToken;
}

export function setAccessToken(token: string | null) {
  tokens.accessToken = token;
  notifyAuthChange();
}

export function clearAuth() {
  setAccessToken(null);
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
    if (tokens.accessToken) {
      return `Bearer ${tokens.accessToken}`;
    }
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const accessCookie = cookies.find(c => c.startsWith('access_token='));
      if (accessCookie) {
        const token = accessCookie.split('=')[1];
        return `Bearer ${token}`;
      }
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
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const res = await this.fetchWithTimeout(
          this.getUrl('auth/refresh'),
          { method: 'POST', credentials: 'include' },
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

    if (res.status === 401 && tokens.accessToken) {
      try {
        const newToken = await this.refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await this.fetchWithTimeout(
          this.getUrl(path),
          { ...fetchOptions, credentials: 'include', headers },
          timeout
        );
      } catch {
        throw new ApiError('Session expired - please log in again', 401);
      }
    }

    if (throwOnError && !res.ok) {
      let message = 'An error occurred';
      try {
        const error = await res.json();
        message = this.sanitizeError(error.message, res.status);
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

  async post<T>(path: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(path: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(path: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

export interface User extends AuthUser {
  emailVerified: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  organisationId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await api.post<LoginResponse>('auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('auth/logout');
  } finally {
    clearAuth();
  }
}

export async function getMe(): Promise<User> {
  return api.get<User>('auth/me');
}

export async function register(
  email: string,
  password: string,
  name: string,
  organisationName: string
): Promise<AuthUser> {
  const data = await api.post<LoginResponse>('auth/register', {
    email,
    password,
    name,
    organisationName,
  });
  setAccessToken(data.accessToken);
  return data.user;
}
