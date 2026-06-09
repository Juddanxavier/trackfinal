"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organisationId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  sessionId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organisationName: string;
}

class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();
  private refreshPromise: Promise<boolean> | null = null;
  private currentSessionId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");
    const sessionId = localStorage.getItem("sessionId");

    if (accessToken && userStr) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.currentSessionId = sessionId;
      try {
        this.user = JSON.parse(userStr);
      } catch {
        this.clearStorage();
      }
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    if (this.accessToken) localStorage.setItem("accessToken", this.accessToken);
    if (this.refreshToken)
      localStorage.setItem("refreshToken", this.refreshToken);
    if (this.user) localStorage.setItem("user", JSON.stringify(this.user));
    if (this.currentSessionId)
      localStorage.setItem("sessionId", this.currentSessionId);
  }

  private clearStorage() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionId");
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.user));
  }

  subscribe(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getSessionId(): string | null {
    return this.currentSessionId;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  decodeToken<T = AuthUser>(token: string): T | null {
    try {
      return jwtDecode<T>(token);
    } catch {
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    const data: AuthResponse = await response.json();
    this.setSession(data);
    return data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Registration failed" }));
      throw new Error(error.message || "Registration failed");
    }

    const result: AuthResponse = await response.json();
    this.setSession(result);
    return result;
  }

  async logout(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.clearSession();
  }

  async logoutAll(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`${API_URL}/auth/logout-all`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.clearSession();
  }

  async getSessions(): Promise<SessionInfo[]> {
    if (!this.accessToken) return [];
    try {
      const response = await fetch(`${API_URL}/auth/sessions`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const response = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this._doRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async _doRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.accessToken;
      if (data.refreshToken) this.refreshToken = data.refreshToken;
      if (data.sessionId) this.currentSessionId = data.sessionId;
      this.saveToStorage();
      return true;
    } catch {
      return false;
    }
  }

  setSession(auth: AuthResponse) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.user = auth.user;
    if (auth.sessionId) this.currentSessionId = auth.sessionId;
    this.saveToStorage();
    this.notifyListeners();
  }

  clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.currentSessionId = null;
    this.clearStorage();
    this.notifyListeners();
  }

  async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed && this.accessToken) {
        headers.set("Authorization", `Bearer ${this.accessToken}`);
        return fetch(url, { ...options, headers: Object.fromEntries(headers) });
      }
      this.clearSession();
    }

    return response;
  }
}

export const auth = new AuthClient();

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(auth.getUser());
    setIsLoading(false);
    const unsubscribe = auth.subscribe(setUser);
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: auth.login.bind(auth),
    register: auth.register.bind(auth),
    logout: auth.logout.bind(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useOptionalAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.subscribe(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken: auth.getAccessToken(),
  };
}
