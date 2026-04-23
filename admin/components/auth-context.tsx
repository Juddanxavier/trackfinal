"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { api, getAccessToken, clearAuth, subscribeAuthChange, getMe, logout as apiLogout, AuthUser, setAccessToken } from "@/lib/api"

export type { AuthUser as User }

export interface Organisation {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  organisations: Organisation[]
  selectedOrganisation: string | null
  setSelectedOrganisation: (orgId: string) => void
  refreshUser: () => Promise<AuthUser | null>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "selectedOrganisationId"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [selectedOrganisation, setSelectedOrganisationState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const logout = React.useCallback(async () => {
    try {
      await apiLogout()
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
    } catch {
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

  React.useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const token = getAccessToken()
        let userData = token ? await refreshUser() : null

        if (!userData && token === null) {
          try {
            const refreshData = await api.post<{ accessToken: string }>('auth/refresh')
            setAccessToken(refreshData.accessToken)
            userData = await refreshUser()
          } catch {
            if (isMounted) setIsLoading(false)
            return
          }
        }

        if (!isMounted) return

        if (!userData) {
          if (isMounted) setIsLoading(false)
          return
        }

        if (window.location.pathname === '/login') {
          window.location.href = '/dashboard'
          return
        }

        const orgs = await fetchOrganisations(userData)
        if (!isMounted) return

        if (orgs.length > 0) {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored && orgs.some(o => o.id === stored)) {
            setSelectedOrganisationState(stored)
          } else {
            setSelectedOrganisationState(userData.organisationId)
            localStorage.setItem(STORAGE_KEY, userData.organisationId)
          }
        } else if (userData.organisationId) {
          setSelectedOrganisationState(userData.organisationId)
        }
      } catch (err) {
        console.error("[Auth] Init failed:", err)
        clearAuth()
        setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    const unsubscribe = subscribeAuthChange(() => {
      const token = getAccessToken()
      if (!token) {
        setUser(null)
        setOrganisations([])
        setSelectedOrganisationState(null)
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
