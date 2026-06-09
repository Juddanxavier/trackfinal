"use client"

import { useState } from "react"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

interface NavItem {
  title: string
  url: string
  icon?: React.ReactNode
}

interface NavSectionProps {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

export function NavSection({
  label,
  items,
  defaultOpen = true,
}: NavSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (items.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="flex cursor-pointer items-center gap-1 text-xs font-semibold tracking-wider text-sidebar-foreground/50 uppercase hover:text-sidebar-foreground/80"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDownIcon className="h-3 w-3" />
        ) : (
          <ChevronRightIcon className="h-3 w-3" />
        )}
        {label}
      </SidebarGroupLabel>
      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  )
}
