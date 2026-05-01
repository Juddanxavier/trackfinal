"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {children}
    </div>
  )
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organisations, selectedOrganisation, setSelectedOrganisation } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <>
      <AppSidebar
        variant="inset"
        organisations={organisations}
        selectedOrganisation={selectedOrganisation || user?.organisationId || undefined}
        onOrganisationChange={setSelectedOrganisation}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute) {
      router.push("/login")
    }
  }, [isLoading, user, isAuthRoute, router])

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[oklch(1_0_0)] dark:bg-[oklch(0.145_0_0)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}