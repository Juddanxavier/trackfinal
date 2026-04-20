"use client"

import * as React from "react"
import { api, clearAuth, getAccessToken, setAccessToken } from "@/lib/api"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "customer"
  organisationId: string
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [selectedOrganisation, setSelectedOrganisationState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [accessToken, setAccessTokenState] = React.useState<string | null>(null)

  // Sync with api.ts
  const setAccessToken = React.useCallback((token: string | null) => {
    setAccessTokenState(token)
    if (token) {
      sessionStorage.setItem('accessToken', token)
    } else {
      sessionStorage.removeItem('accessToken')
    }
  }, [])

  const refreshUser = React.useCallback(async () => {
    try {
      const userData = await api.get<User>("/auth/check")
      setUser(userData)
      return userData
    } catch {
      setUser(null)
      return null
    }
  }, [])

  const fetchOrganisations = React.useCallback(async (userData: User) => {
    if (!userData.organisationId) {
      setOrganisations([])
      return []
    }
    if (userData.role === "admin") {
      try {
        const orgs = await api.get<Organisation[]>("/organisations")
        setOrganisations(orgs)
        return orgs
      } catch {
        setOrganisations([])
        return []
      }
    }
    try {
      const org = await api.get<Organisation>("/organisations/me")
      setOrganisations([org])
      return [org]
    } catch {
      setOrganisations([])
      return []
    }
  }, [])

  React.useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        // Restore token from sessionStorage if in memory is empty
        const storedToken = sessionStorage.getItem('accessToken');
        if (storedToken && !accessToken) {
          setAccessToken(storedToken);
        }
        
        const userData = await refreshUser()
        if (userData) {
          const orgs = await fetchOrganisations(userData)
          
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
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    init()
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
