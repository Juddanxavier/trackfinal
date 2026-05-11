import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { CsrfProvider } from "@csrf-armor/nextjs/client"

const inter = Inter({subsets:['latin'],variable:'--font-sans'})
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: 'GT Express',
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}>
        <ErrorBoundary>
          <CsrfProvider>
            <ThemeProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </ThemeProvider>
          </CsrfProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}