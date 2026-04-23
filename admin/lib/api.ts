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

  private sanitizeError(message: string, statusCode?: number): string {
    // Return more specific messages based on status code
    if (statusCode === 401) {
      return 'Unauthorized - Please log in again';
    }
    if (statusCode === 403) {
      return 'Access denied - Insufficient permissions';
    }
    if (statusCode === 404) {
      return 'Resource not found';
    }
    if (statusCode === 422 || statusCode === 400) {
      return message.includes('validation') ? 'Invalid input' : message;
    }
    if (statusCode && statusCode >= 500) {
      return `Server error (${statusCode}) - Please try again later`;
    }

    // Check for specific keywords in the message
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes('permission') ||
      lowerMessage.includes('denied') ||
      lowerMessage.includes('forbidden')
    ) {
      return 'Access denied';
    }
    if (lowerMessage.includes('not found')) {
      return 'Resource not found';
    }
    if (lowerMessage.includes('validation')) {
      return 'Invalid input';
    }

    // Return original message if it's informative, otherwise generic
    return message.length > 5 && message.length < 100 ? message : 'Something went wrong';
  }

  private getAuthHeader(): string | null {
    if (accessToken) {
      console.log('[ApiClient] Using module accessToken:', accessToken.substring(0, 20) + '...');
      return `Bearer ${accessToken}`;
    }
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    if (stored) {
      console.log('[ApiClient] Using sessionStorage token:', stored.substring(0, 20) + '...');
      return `Bearer ${stored}`;
    }
    console.log('[ApiClient] No token found - accessToken:', accessToken, 'sessionStorage:', stored);
    return null;
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
        message = this.sanitizeError(error.message || message, res.status);
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