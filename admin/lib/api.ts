const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
}

let csrfToken: string | null = null;
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch {
    return null;
  }
}

export function clearCsrfToken() {
  csrfToken = null;
}

export function clearAuth() {
  accessToken = null;
  csrfToken = null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getUrl(path: string) {
    const url = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${url}`;
  }

  private sanitizeError(message: string): string {
    if (
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('unauthorized')
    ) {
      return 'Access denied';
    }
    if (message.includes('not found')) {
      return 'Resource not found';
    }
    if (message.includes('validation')) {
      return 'Invalid input';
    }
    return 'Something went wrong';
  }

  private getAuthHeader(): string | null {
    if (accessToken) return `Bearer ${accessToken}`;
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    return stored ? `Bearer ${stored}` : null;
  }

  async fetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { throwOnError = true, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers as Record<string, string>,
    };

    // Add JWT token to Authorization header
    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(fetchOptions.method || 'GET')) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(this.getUrl(path), {
      ...fetchOptions,
      credentials: 'include',
      headers,
    });

    if (throwOnError && !res.ok) {
      let message = 'An error occurred';
      try {
        const error = await res.json();
        message = this.sanitizeError(error.message || message);
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