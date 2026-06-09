"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  api,
  subscribeAuthChange,
  restoreSession,
  login as apiLogin,
  logout as apiLogout,
  AuthUser,
  hasValidSession,
  getCurrentUser,
  fetchCsrfToken,
} from "@/lib/api"

export type { AuthUser as User }

export interface Organisation {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  countryCode?: string
  currency?: string
  logoUrl?: string
  createdAt?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  organisations: Organisation[]
  selectedOrganisation: string | null
  setSelectedOrganisation: (orgId: string) => void
  refreshUser: () => Promise<AuthUser | null>
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  can: (action: string, object: string) => boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "selectedOrganisationId"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [selectedOrganisation, setSelectedOrganisationState] = React.useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const isInitialized = React.useRef(false)

  const logout = React.useCallback(async () => {
    try {
      await apiLogout()
    } catch (err) {
      console.error("Logout API call failed:", err)
      toast.error("Failed to logout")
    } finally {
      setUser(null)
      setOrganisations([])
      setSelectedOrganisationState(null)
      router.push("/login")
    }
  }, [router])

  const refreshUser = React.useCallback(async (): Promise<AuthUser | null> => {
    try {
      // restoreSession validates the token with the server
      const userData = await restoreSession()
      if (userData) {
        setUser(userData)
      }
      return userData
    } catch (err) {
      console.error("Failed to refresh user:", err)
      toast.error("Failed to refresh user session")
      setUser(null)
      return null
    }
  }, [])

  const fetchOrganisations = React.useCallback(
    async (userData: AuthUser): Promise<Organisation[]> => {
      try {
        let orgs: Organisation[] = []

        if (userData.role === "admin") {
          // Admin sees only their own org (API filters based on role)
          const response: any = await api.get<Organisation[]>(
            "/organisations",
            { throwOnError: false }
          )
          const allOrgs = response?.value || response?.data || response
          if (Array.isArray(allOrgs)) {
            orgs = allOrgs
          }

          // If no orgs found, try to fetch user's own org
          if (orgs.length === 0 && userData.organisationId) {
            const userOrg = await api.get<Organisation>(
              `/organisations/${userData.organisationId}`,
              { throwOnError: false }
            )
            if (userOrg && !("error" in userOrg)) {
              orgs = [userOrg]
            }
          }
        } else {
          // Non-admins: fetch their own organisation
          if (userData.organisationId) {
            const userOrg = await api.get<Organisation>("/organisations/me", {
              throwOnError: false,
            })
            if (userOrg && !("error" in userOrg)) {
              orgs = [userOrg]
            } else {
              // Fallback to direct ID
              const org = await api.get<Organisation>(
                `/organisations/${userData.organisationId}`,
                { throwOnError: false }
              )
              if (org && !("error" in org)) {
                orgs = [org]
              }
            }
          }
        }

        setOrganisations(orgs)

        if (orgs.length === 0) {
          toast.error("Failed to load organisation data")
        }

        return orgs
      } catch (err) {
        console.error("[AuthContext] Error fetching organisations:", err)
        toast.error("Failed to load organisations")
        setOrganisations([])
        return []
      }
    },
    []
  )

  const login = React.useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const result = await apiLogin(email, password)

      if (!("id" in result)) {
        if ((result as any).sessionToken) {
          throw new Error("requiresTwoFactor")
        }
        throw new Error("Login failed")
      }

      const user = result as AuthUser

      // Check if user is a customer - customers cannot access admin
      if (user.role === "customer") {
        await logout()
        throw new Error(
          "Access denied. Customers cannot access the admin portal."
        )
      }

      setUser(user)

      // Fetch new CSRF token after login
      await fetchCsrfToken()

      const orgs = await fetchOrganisations(user)

      // Set selected organisation
      const orgId = user.organisationId || (orgs.length > 0 ? orgs[0].id : null)
      if (orgId) {
        setSelectedOrganisationState(orgId)
        localStorage.setItem(STORAGE_KEY, orgId)
      }

      return user
    },
    [fetchOrganisations, logout]
  )

  // Initialize auth state
  React.useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const init = async () => {
      // Fetch CSRF token early for state-changing operations
      await fetchCsrfToken()

      const isAuthPage = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ].some((path) => pathname === path || pathname.startsWith(`${path}/`))

      try {
        if (isAuthPage) {
          // On auth pages, just check if already logged in
          if (hasValidSession()) {
            const userData = await refreshUser()
            if (userData && userData.role !== "customer") {
              router.push("/dashboard")
              return
            }
          }
          setIsLoading(false)
          return
        }

        // On protected pages, restore session
        const userData = await restoreSession()

        if (!userData) {
          router.push("/login")
          return
        }

        // Check if customer
        if (userData.role === "customer") {
          await logout()
          return
        }

        setUser(userData)
        const orgs = await fetchOrganisations(userData)

        // Restore selected organisation from storage or use user's org
        const storedOrgId = localStorage.getItem(STORAGE_KEY)
        const validOrgId =
          storedOrgId && orgs.some((o) => o.id === storedOrgId)
            ? storedOrgId
            : userData.organisationId || (orgs.length > 0 ? orgs[0].id : null)

        if (validOrgId) {
          setSelectedOrganisationState(validOrgId)
          localStorage.setItem(STORAGE_KEY, validOrgId)
        }
      } catch (err) {
        console.error("[AuthContext] Initialization error:", err)
        await logout()
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Listen for auth changes from other tabs
    const unsubscribe = subscribeAuthChange(() => {
      const currentUser = getCurrentUser()
      setUser(currentUser)
      if (!currentUser) {
        setOrganisations([])
        setSelectedOrganisationState(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pathname, router, logout, refreshUser, fetchOrganisations])

  const setSelectedOrganisation = React.useCallback((orgId: string) => {
    setSelectedOrganisationState(orgId)
    localStorage.setItem(STORAGE_KEY, orgId)
  }, [])

  const can = React.useCallback(
    (action: string, object: string): boolean => {
      if (!user?.permissions) return false
      const perms = user.permissions
      const allowedObjects = perms[action] || perms["*"] || []
      if (allowedObjects.includes("*")) return true
      if (allowedObjects.includes(object)) return true
      return false
    },
    [user?.permissions]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        organisations,
        selectedOrganisation,
        setSelectedOrganisation,
        refreshUser,
        login,
        logout,
        can,
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
