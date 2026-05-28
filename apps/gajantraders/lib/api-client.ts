import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'gt_access_token';

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Get token from localStorage
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Pending request queue for when we're refreshing the token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Perform token refresh
async function doRefreshToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth state on refresh failure
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    window.location.href = '/login?expired=true';
    return null;
  }
}

// Main API client function
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Get current token
  let token = getStoredToken();
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // Add auth header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 - Token expired or invalid
  if (response.status === 401) {
    // Try to refresh token
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await doRefreshToken();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        // Retry original request with new token
        return retryRequest<T>(url, options, newToken);
      }
    } else {
      // Wait for refresh to complete then retry
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          retryRequest<T>(url, options, newToken)
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  // Handle other errors
  if (!response.ok) {
    const error: ApiError = new Error(`API Error: ${response.statusText}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }
    throw error;
  }

  // Parse JSON response
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Retry request with new token
async function retryRequest<T>(
  url: string,
  options: RequestInit,
  token: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = new Error(`API Error: ${response.statusText}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Helper methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
  
  put: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  
  patch: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};