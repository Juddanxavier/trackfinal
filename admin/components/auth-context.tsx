"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { api, clearAuth, subscribeAuthChange, getMe, logout as apiLogout, login as apiLogin, AuthUser, hasValidSession, restoreSession } from "@/lib/api"

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
  isActive?: boolean
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
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "selectedOrganisationId"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [selectedOrganisation, setSelectedOrganisationState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const logout = React.useCallback(async () => {
    try {
      await apiLogout()
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      clearAuth()
      setUser(null)
      setOrganisations([])
      setSelectedOrganisationState(null)
      router.push('/login')
    }
  }, [router])

  const refreshUser = React.useCallback(async (): Promise<AuthUser | null> => {
    try {
      const userData = await getMe()
      setUser(userData)
      return userData
    } catch (err) {
      clearAuth()
      setUser(null)
      return null
    }
  }, [])

  const fetchOrganisations = React.useCallback(async (userData: AuthUser): Promise<Organisation[]> => {
    if (!userData.organisationId) {
      return []
    }

    try {
      let orgs: Organisation[]
      if (userData.role === "admin") {
        orgs = await api.get<Organisation[]>("/organisations")
        if (!Array.isArray(orgs) || orgs.length === 0) {
          orgs = [await api.get<Organisation>(`/organisations/${userData.organisationId}`)]
        }
      } else {
        orgs = [await api.get<Organisation>(`/organisations/${userData.organisationId}`)]
      }
      setOrganisations(orgs)
      return orgs
    } catch {
      setOrganisations([])
      return []
    }
  }, [])

  const login = React.useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const user = await apiLogin(email, password)
    setUser(user)
    const orgs = await fetchOrganisations(user)
    if (orgs.length > 0) {
      if (user.organisationId) {
        setSelectedOrganisationState(user.organisationId)
        localStorage.setItem(STORAGE_KEY, user.organisationId)
      }
    } else if (user.organisationId) {
      setSelectedOrganisationState(user.organisationId)
      localStorage.setItem(STORAGE_KEY, user.organisationId)
    }
    return user
  }, [fetchOrganisations])

  React.useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname.startsWith('/(auth)') || pathname.startsWith('/reset-password')

        if (isAuthPage) {
          if (hasValidSession()) {
            const userData = await refreshUser()
            if (userData) {
              router.push('/dashboard')
              return
            }
          }
          if (isMounted) setIsLoading(false)
          return
        }

        let userData: AuthUser | null = null

        if (hasValidSession()) {
          userData = await refreshUser()
        } else {
          userData = await restoreSession()
        }

        if (!userData) {
          if (isMounted) {
            clearAuth()
            router.push('/login')
          }
          return
        }

        const orgs = await fetchOrganisations(userData)
        if (!isMounted) return

        if (orgs.length > 0) {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored && orgs.some(o => o.id === stored)) {
            setSelectedOrganisationState(stored)
          } else if (userData.organisationId) {
            setSelectedOrganisationState(userData.organisationId)
            localStorage.setItem(STORAGE_KEY, userData.organisationId)
          }
        } else if (userData.organisationId) {
          setSelectedOrganisationState(userData.organisationId)
          localStorage.setItem(STORAGE_KEY, userData.organisationId)
        }
      } catch {
        clearAuth()
        setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    const unsubscribe = subscribeAuthChange(async () => {
      if (!hasValidSession()) {
        setUser(null)
        setOrganisations([])
        setSelectedOrganisationState(null)
      } else if (!user) {
        const userData = await refreshUser()
        if (userData) {
          await fetchOrganisations(userData)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
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
        login,
        logout,
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