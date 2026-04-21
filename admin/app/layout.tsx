"use client"

import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth-context"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const authRoutes = ["/login", "/register", "/forgot-password"]

function RootProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  if (isAuthRoute) {
    return (
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
