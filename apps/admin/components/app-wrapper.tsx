"use client"

import { PageTransition } from "@/components/page-transition"

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}