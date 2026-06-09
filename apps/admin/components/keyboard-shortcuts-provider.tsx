"use client"

import { useRouter } from "next/navigation"
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts"

export function KeyboardShortcutsProvider() {
  const router = useRouter()

  useKeyboardShortcuts({
    "g+d": {
      handler: () => router.push("/dashboard"),
      description: "Go to Dashboard",
    },
    "g+s": {
      handler: () => router.push("/shipments"),
      description: "Go to Shipments",
    },
    "g+q": {
      handler: () => router.push("/quotes"),
      description: "Go to Quotes",
    },
    "g+u": { handler: () => router.push("/users"), description: "Go to Users" },
    "g+r": {
      handler: () => router.push("/reports"),
      description: "Go to Reports",
    },
    "g+o": {
      handler: () => router.push("/organisations"),
      description: "Go to Organisations",
    },
    "g+i": {
      handler: () => router.push("/invitations"),
      description: "Go to Invitations",
    },
    "g+n": {
      handler: () => router.push("/notifications"),
      description: "Go to Notifications",
    },
    "g+/": {
      handler: () => router.push("/search"),
      description: "Go to Search",
    },
  })

  return null
}
