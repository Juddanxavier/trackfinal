"use client"

import Image from "next/image"
import bglogin from "@/public/bglogin.png"
import { CommandIcon } from "lucide-react"

export function AuthSidebar() {
  return (
    <div className="relative hidden h-screen lg:flex">
      <Image
        src={bglogin}
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-10">
        <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <CommandIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">GT Express</h1>
        </div>
      </div>
    </div>
  )
}
