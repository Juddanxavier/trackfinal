'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'gt_access_token';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organisationId: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasValidSession: () => boolean;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  organisationId: string | null;
  exp: number;
  iat: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get token from localStorage
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Set token in localStorage
function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

// Decode user from token
function decodeUserFromToken(token: string): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      organisationId: decoded.organisationId,
    };
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we have a valid session
  const hasValidSession = useCallback((): boolean => {
    const token = getStoredToken();
    return !!token && !isTokenExpired(token);
  }, []);

  // Refresh token function - defined before useEffect to avoid reference issues
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Auth] Refreshing token...');
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        console.log('[Auth] Refresh failed:', res.status);
        return false;
      }

      const data = await res.json();
      console.log('[Auth] Refresh successful');
      setStoredToken(data.accessToken);
      const userData = decodeUserFromToken(data.accessToken);
      if (userData) {
        setUser(userData);
      }
      return true;
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      return false;
    }
  }, []);

  // Initialize auth state - only runs once on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      console.log('[Auth] Initializing...');
      
      const token = getStoredToken();
      console.log('[Auth] Token exists:', !!token);
      
      if (token && !isTokenExpired(token)) {
        console.log('[Auth] Token valid, decoding user');
        const userData = decodeUserFromToken(token);
        if (userData && isMounted) {
          console.log('[Auth] User decoded:', userData.email);
          setUser(userData);
        } else if (isMounted) {
          console.log('[Auth] Failed to decode user, clearing');
          setStoredToken(null);
        }
      } else if (token && isTokenExpired(token)) {
        console.log('[Auth] Token expired, attempting refresh');
        // Token expired, try to refresh
        const refreshed = await refreshToken();
        if (!refreshed && isMounted) {
          console.log('[Auth] Refresh failed, clearing auth');
          setStoredToken(null);
          setUser(null);
        }
      } else {
        console.log('[Auth] No token found');
        if (isMounted) {
          setUser(null);
        }
      }
      
      if (isMounted) {
        console.log('[Auth] Initialization complete');
        setIsLoading(false);
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    console.log('[Auth] Logging in:', email);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Login failed:', error.message);
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    console.log('[Auth] Login successful');
    setStoredToken(data.accessToken);
    setUser(data.user);
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    const token = getStoredToken();
    
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('[Auth] Logout API call failed:', error);
      }
    }

    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
        hasValidSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}