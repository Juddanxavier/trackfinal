"use client"

import { cn } from "@/lib/utils"

const gradients = [
  "from-red-400 via-purple-500 to-blue-500",
  "from-yellow-400 via-pink-500 to-purple-600",
  "from-green-400 via-cyan-500 to-blue-500",
  "from-orange-400 via-red-500 to-pink-500",
  "from-purple-400 via-pink-500 to-orange-400",
  "from-blue-400 via-green-400 to-teal-500",
  "from-pink-400 via-rose-500 to-red-500",
  "from-cyan-400 via-blue-500 to-indigo-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-violet-400 via-purple-500 to-pink-500",
  "from-lime-400 via-green-500 to-emerald-500",
  "from-rose-400 via-pink-500 to-fuchsia-500",
  "from-sky-400 via-blue-500 to-violet-500",
  "from-orange-400 via-amber-500 to-yellow-500",
  "from-teal-400 via-cyan-500 to-sky-500",
  "from-indigo-400 via-purple-500 to-rose-500",
]

function getGradientFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

interface UserAvatarProps {
  name: string
  email?: string
  className?: string
}

export function UserAvatar({ name, email, className }: UserAvatarProps) {
  const firstLetter = name.charAt(0).toUpperCase()
  const gradient = getGradientFromString(email || name)

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm",
        "bg-gradient-to-br",
        gradient,
        "shadow-lg shadow-black/25",
        "ring-2 ring-white/30",
        "dark:ring-white/20",
        "dark:shadow-black/40",
        className
      )}
    >
      {firstLetter}
    </div>
  )
}