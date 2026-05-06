"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/components/auth-context"
import { UserAvatar } from "@/components/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BadgeCheck,
  CreditCard,
  LogOut,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  SearchIcon,
  CommandIcon,
  SettingsIcon,
  BellIcon,
  HelpCircleIcon,
} from "lucide-react"
import Link from "next/link"
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/quotes": "Quotes",
  "/shipments": "Shipments",
  "/notifications": "Notifications",
  "/reports": "Reports",
  "/settings": "Settings",
  "/help": "Help",
  "/docs": "Documentation",
  "/search": "Search",
}

const quickLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Shipments", href: "/shipments" },
  { label: "Quotes", href: "/quotes" },
  { label: "Users", href: "/users" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const pageTitle = PAGE_TITLES[pathname] || PAGE_TITLES[pathname.split("/")[1] || ""] || "Dashboard"

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-48 hidden md:flex justify-start gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <CommandIcon className="h-3 w-3" />
              <span className="text-xs">K</span>
            </kbd>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === "dark" ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>
          <NotificationBell />
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <UserAvatar name={user.name} email={user.email} className="h-8 w-8 rounded-full" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user.name}</span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                      <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserAvatar name={user.name} email={user.email} className="h-8 w-8 rounded-full" />
                        <div className="grid flex-1 gap-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <Link href="/profile">
                        <DropdownMenuItem>
                          <BadgeCheck />
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile/edit">
                        <DropdownMenuItem>
                          <CreditCard />
                          Edit Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/settings">
                        <DropdownMenuItem>
                          <SettingsIcon />
                          Settings
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/notifications">
                        <DropdownMenuItem>
                          <BellIcon />
                          Notifications
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/help">
                        <DropdownMenuItem>
                          <HelpCircleIcon />
                          Help
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {quickLinks.map((link) => (
              <CommandItem key={link.href} onSelect={() => { router.push(link.href); setSearchOpen(false) }}>
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}