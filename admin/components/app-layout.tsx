"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"

const authRoutes = ["/login", "/register", "/forgot-password"]

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-background">
      {children}
    </div>
  )
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, organisations, selectedOrganisation, setSelectedOrganisation } = useAuth()

  return (
    <>
      <AppSidebar
        variant="inset"
        organisations={organisations}
        selectedOrganisation={selectedOrganisation || user?.organisationId || undefined}
        onOrganisationChange={setSelectedOrganisation}
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
  const { isLoading } = useAuth()

  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-muted/30 to-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}