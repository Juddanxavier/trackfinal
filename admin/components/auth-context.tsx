"use client"

import * as React from "react"
import { api, clearAuth, getAccessToken, setAccessToken as setApiAccessToken } from "@/lib/api"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "customer"
  organisationId: string
  avatar?: string
}

export interface Organisation {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  organisations: Organisation[]
  selectedOrganisation: string | null
  setSelectedOrganisation: (orgId: string) => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "selectedOrganisationId"

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path.startsWith(p))
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
    clearAuth()
    window.location.href = '/login'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [selectedOrganisation, setSelectedOrganisationState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [accessToken, setAccessTokenState] = React.useState<string | null>(null)

  // Sync with api.ts
  const setAccessToken = React.useCallback((token: string | null) => {
    setAccessTokenState(token)
    setApiAccessToken(token)  // Also update the api.ts module's token
    if (token) {
      sessionStorage.setItem('accessToken', token)
    } else {
      sessionStorage.removeItem('accessToken')
    }
  }, [])

  const refreshUser = React.useCallback(async () => {
    try {
      console.log('[Auth] Calling /auth/check...')
      const userData = await api.get<User>("/auth/check")
      console.log('[Auth] /auth/check success:', userData?.email)
      setUser(userData)
      return userData
    } catch (err: any) {
      console.error('[Auth] /auth/check failed:', err?.message || err)
      setUser(null)
      if (err.statusCode === 401) {
        redirectToLogin()
      }
      return null
    }
  }, [])

  const fetchOrganisations = React.useCallback(async (userData: User) => {
    if (!userData.organisationId) {
      console.log("[Auth] No organisationId on user, skipping org fetch")
      setOrganisations([])
      return []
    }

    // For admin users, try to fetch all organisations
    if (userData.role === "admin") {
      try {
        console.log("[Auth] Admin user detected, fetching all organisations...")
        const orgs = await api.get<Organisation[]>("/organisations")
        console.log("[Auth] Organisations list response:", orgs)
        if (orgs && Array.isArray(orgs) && orgs.length > 0) {
          setOrganisations(orgs)
          return orgs
        }
      } catch (err: any) {
        console.error("[Auth] Failed to fetch organisations list:", err?.message || err)
        if (err.statusCode === 401) {
          redirectToLogin()
        }
      }

      // Fallback: fetch user's own organisation
      try {
        console.log("[Auth] Falling back to fetch user's organisation...")
        const singleOrg = await api.get<Organisation>(`/organisations/${userData.organisationId}`)
        console.log("[Auth] Single org response:", singleOrg)
        if (singleOrg && singleOrg.id) {
          setOrganisations([singleOrg])
          return [singleOrg]
        }
      } catch (e: any) {
        console.error("[Auth] Fallback org fetch also failed:", e?.message || e)
        if (e.statusCode === 401) {
          redirectToLogin()
        }
      }

      console.log("[Auth] No organisations found")
      setOrganisations([])
      return []
    }

    // For non-admin users, fetch their own organisation only
    try {
      console.log("[Auth] Non-admin user, fetching own organisation...")
      const org = await api.get<Organisation>(`/organisations/${userData.organisationId}`)
      console.log("[Auth] Non-admin org response:", org)
      if (org && org.id) {
        setOrganisations([org])
        return [org]
      }
      setOrganisations([])
      return []
    } catch (err: any) {
      console.error("[Auth] Failed to fetch organisation:", err?.message || err)
      if (err.statusCode === 401) {
        redirectToLogin()
      }
      setOrganisations([])
      return []
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true
    const init = async () => {
      setIsLoading(true)
      try {
        const storedToken = sessionStorage.getItem('accessToken')
        console.log('[Auth] Init - storedToken exists:', !!storedToken)
        
        // Always sync api.ts token immediately before any API calls
        if (storedToken) {
          console.log('[Auth] Syncing api.ts token from sessionStorage')
          setApiAccessToken(storedToken)
        }
        
        // Also update React state if needed
        if (storedToken && !accessToken) {
          setAccessToken(storedToken)
        }

        const userData = await refreshUser()
        if (!isMounted) return

        if (userData) {
          const orgs = await fetchOrganisations(userData)
          if (!isMounted) return

          if (orgs.length > 0) {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored && orgs.some(o => o.id === stored)) {
              setSelectedOrganisationState(stored)
            } else {
              setSelectedOrganisationState(userData.organisationId)
              if (userData.organisationId) {
                localStorage.setItem(STORAGE_KEY, userData.organisationId)
              }
            }
          } else if (userData.organisationId) {
            setSelectedOrganisationState(userData.organisationId)
          }
        }
      } catch (err) {
        console.error("Auth init failed:", err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    init()
    return () => { isMounted = false }
  }, [refreshUser, fetchOrganisations])

  const setSelectedOrganisation = React.useCallback((orgId: string) => {
    setSelectedOrganisationState(orgId)
    localStorage.setItem(STORAGE_KEY, orgId)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        organisations,
        selectedOrganisation,
        setSelectedOrganisation,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
