import { jwtDecode } from "jwt-decode"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

const isDev = process.env.NODE_ENV === "development"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  if (isDev) console.log(...args)
}

const DEFAULT_TIMEOUT = 10000
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000

const TOKEN_KEY = "track_access_token"
const REFRESH_TOKEN_KEY = "track_refresh_token"
const CSRF_TOKEN_KEY = "csrf_token"

// CSRF Token management
let csrfToken: string | null = null

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf/token`, {
      method: "GET",
      credentials: "include",
    })
    if (response.ok) {
      const data = await response.json()
      csrfToken = data.csrfToken
      return csrfToken
    }
  } catch (error) {
    console.error("[API] Failed to fetch CSRF token:", error)
  }
  return null
}

// Simple token storage - always read from localStorage directly
function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    console.warn("localStorage not available")
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
      document.cookie = "track_session=1; path=/; max-age=604800; SameSite=Lax"
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      document.cookie = "track_session=; path=/; max-age=0; SameSite=Lax"
    }
  } catch {
    console.warn("localStorage not available")
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface ApiOptions extends RequestInit {
  throwOnError?: boolean
  timeout?: number
}

let refreshPromise: Promise<string> | null = null
const listeners: Set<() => void> = new Set()

export function notifyAuthChange() {
  listeners.forEach((cb) => cb())
}

export function subscribeAuthChange(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getUrl(path: string): string {
    const prefix = path.startsWith("/") ? "" : "/"
    const url = `${this.baseUrl}${prefix}${path}`

    // Validate URL
    try {
      new URL(url)
    } catch (e) {
      console.error(`[API] Invalid URL constructed: ${url}`)
      throw new Error(`Invalid API URL: ${url}`)
    }

    return url
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      log(`[API] Making request to: ${url}`, {
        method: options.method || "GET",
      })
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      log(`[API] Response from ${url}:`, response.status)
      return response
    } catch (error) {
      console.error(`[API] Fetch failed for ${url}:`, error)
      // Re-throw with more context
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`)
        }
        if (error.message.includes("fetch")) {
          throw new Error(
            `Network error: Cannot connect to ${url}. Is the API server running?`
          )
        }
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      try {
        log("[API] Attempting token refresh...")
        const storedRefreshToken = getRefreshToken()
        const body = storedRefreshToken
          ? { refreshToken: storedRefreshToken }
          : undefined

        const res = await this.fetchWithTimeout(
          this.getUrl("auth/refresh"),
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
          },
          DEFAULT_TIMEOUT
        )

        if (!res.ok) {
          console.error("[API] Token refresh failed:", res.status)
          setToken(null)
          setRefreshToken(null)
          notifyAuthChange()
          throw new ApiError("Session expired", 401)
        }

        const data = await res.json()
        setToken(data.accessToken)
        if (data.refreshToken) setRefreshToken(data.refreshToken)
        notifyAuthChange()
        log("[API] Token refresh successful")
        return data.accessToken
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  private buildHeaders(fetchOptions: ApiOptions): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    }

    const token = getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"]
    if (mutatingMethods.includes(fetchOptions.method || "GET") && csrfToken) {
      headers["X-CSRF-Token"] = csrfToken
    }

    return headers
  }

  private isAuthEndpoint(path: string): boolean {
    return (
      path.includes("auth/login") ||
      path.includes("auth/refresh") ||
      path.includes("auth/register")
    )
  }

  private async maybeRetryCsrf(
    initialResponse: Response,
    path: string,
    fetchOptions: ApiOptions,
    headers: Record<string, string>,
    timeout: number
  ): Promise<Response> {
    const errorData = await initialResponse.json().catch(() => ({}))
    if (
      !errorData.message?.includes("CSRF") &&
      !errorData.error?.includes("CSRF")
    ) {
      return initialResponse
    }

    log("[API] Got 403 CSRF error, fetching new token...")
    const newCsrfToken = await fetchCsrfToken()
    if (!newCsrfToken) return initialResponse

    headers["X-CSRF-Token"] = newCsrfToken
    return this.fetchWithTimeout(
      this.getUrl(path),
      { ...fetchOptions, credentials: "include", headers },
      timeout
    )
  }

  private async retryAfterRefresh(
    path: string,
    fetchOptions: ApiOptions,
    headers: Record<string, string>,
    timeout: number,
    throwOnError: boolean
  ): Promise<Response> {
    log("[API] Got 401, attempting token refresh...")
    try {
      const newToken = await this.refreshAccessToken()
      headers["Authorization"] = `Bearer ${newToken}`
      return this.fetchWithTimeout(
        this.getUrl(path),
        { ...fetchOptions, credentials: "include", headers },
        timeout
      )
    } catch (refreshError) {
      console.error("[API] Token refresh failed:", refreshError)
      setToken(null)
      notifyAuthChange()
      if (typeof window !== "undefined" && throwOnError) {
        window.location.href = "/login"
      }
      throw new ApiError("Session expired", 401)
    }
  }

  private async parseErrorBody<T>(
    res: Response,
    throwOnError: boolean
  ): Promise<T> {
    let message = "An error occurred"
    try {
      const errorData = await res.json()
      message = errorData.message || `Request failed with status ${res.status}`
    } catch {
      message = `Request failed with status ${res.status}`
    }

    if (!throwOnError) {
      return { statusCode: res.status, message, error: true } as unknown as T
    }
    throw new ApiError(message, res.status)
  }

  async fetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const {
      throwOnError = true,
      timeout = DEFAULT_TIMEOUT,
      ...fetchOptions
    } = options

    if (!path) {
      if (!throwOnError) return {} as T
      throw new ApiError("Request path is empty", 400)
    }

    const headers = this.buildHeaders(fetchOptions)

    const performRequest = (): Promise<Response> => {
      const url = this.getUrl(path)
      log(`[API] Fetching: ${url}`, {
        method: fetchOptions.method || "GET",
        hasAuth: !!headers["Authorization"],
        path,
      })
      return this.fetchWithTimeout(
        url,
        { ...fetchOptions, credentials: "include", headers },
        timeout
      )
    }

    let res: Response
    try {
      res = await performRequest()
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new ApiError("Request timed out", 408)
      }
      throw new ApiError(e instanceof Error ? e.message : "Network error", 0)
    }

    if (res.status === 403) {
      res = await this.maybeRetryCsrf(res, path, fetchOptions, headers, timeout)
    }

    if (res.status === 401 && !this.isAuthEndpoint(path)) {
      res = await this.retryAfterRefresh(
        path,
        fetchOptions,
        headers,
        timeout,
        throwOnError
      )
    }

    if (!res.ok) {
      return this.parseErrorBody(res, throwOnError)
    }

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T
    }

    return res.json() as T
  }

  async get<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, { ...options, method: "GET" })
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: ApiOptions
  ): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: ApiOptions
  ): Promise<T> {
    return this.fetch<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.fetch<T>(path, { ...options, method: "DELETE" })
  }
}

export const api = new ApiClient(API_BASE_URL)

export async function logout() {
  try {
    await api.post("auth/logout")
  } finally {
    setToken(null)
    setRefreshToken(null)
    notifyAuthChange()
  }
}

export async function login(email: string, password: string) {
  const data = await api.post<{
    accessToken: string
    refreshToken?: string
    user: AuthUser
    requiresTwoFactor?: boolean
    sessionToken?: string
  }>("auth/login", { email, password })
  if (data.requiresTwoFactor) {
    return {
      requiresTwoFactor: true as const,
      sessionToken: data.sessionToken!,
    }
  }
  setToken(data.accessToken)
  if (data.refreshToken) setRefreshToken(data.refreshToken)
  notifyAuthChange()
  return data.user
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  organisationId: string | null
  branchId: string | null
  emailVerified: boolean
  avatar: string
  phoneNumber?: string
  permissions?: Record<string, string[]>
}

export function getCurrentUser(): AuthUser | null {
  const token = getToken()
  if (!token) return null

  try {
    const decoded = jwtDecode<any>(token)
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email,
      role: decoded.role,
      organisationId: decoded.organisationId,
      branchId: decoded.branchId || null,
      emailVerified: decoded.email_verified || true,
      avatar: "",
    }
  } catch {
    return null
  }
}

export function hasValidSession(): boolean {
  return !!getToken()
}

async function attemptTokenRefresh(): Promise<boolean> {
  const storedRefreshToken = getRefreshToken()
  const refreshBody = storedRefreshToken
    ? { refreshToken: storedRefreshToken }
    : undefined

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: refreshBody ? JSON.stringify(refreshBody) : undefined,
  })

  if (!res.ok) {
    log("[Auth] Refresh failed, clearing session")
    setToken(null)
    setRefreshToken(null)
    return false
  }

  const data = await res.json()
  setToken(data.accessToken)
  if (data.refreshToken) setRefreshToken(data.refreshToken)
  return true
}

export async function restoreSession(): Promise<AuthUser | null> {
  if (!getToken()) {
    log("[Auth] No token to restore")
    return null
  }

  try {
    log("[Auth] Validating token with auth/me...")
    const user = await api.get<AuthUser>("auth/me")
    log("[Auth] Token valid, user:", user.email)
    return user
  } catch {
    log("[Auth] Token validation failed, trying refresh...")
  }

  try {
    const refreshed = await attemptTokenRefresh()
    if (!refreshed) return null

    log("[Auth] Refresh successful")
    return api.get<AuthUser>("auth/me")
  } catch (refreshError) {
    console.error("[Auth] Refresh error:", refreshError)
    setToken(null)
    setRefreshToken(null)
    return null
  }
}
