"use client"

import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth-context"
import { AppLayout } from "@/components/app-layout"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}>
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
        <Toaster />
      </body>
    </html>
  )
}