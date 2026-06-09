"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { NavSection } from "@/components/nav-section"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/components/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  LayoutDashboardIcon,
  UserIcon,
  CommandIcon,
  SearchIcon,
  TruckIcon,
  UsersIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  FileChartColumnIcon,
  Building2Icon,
  BellIcon,
  MailIcon,
} from "lucide-react"

export interface Organisation {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  countryCode?: string
  currency?: string
  logoUrl?: string
  createdAt?: string
}

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
  adminOnly?: boolean
  permissionKey?: string
}

const navSections: {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}[] = [
  {
    label: "Operations",
    defaultOpen: true,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
      { title: "Quotes", url: "/quotes", icon: <FileTextIcon /> },
      { title: "Shipments", url: "/shipments", icon: <TruckIcon /> },
    ],
  },
  {
    label: "Administration",
    defaultOpen: true,
    items: [
      { title: "Users", url: "/users", icon: <UsersIcon /> },
      {
        title: "Organisations",
        url: "/organisations",
        icon: <Building2Icon />,
        adminOnly: true,
      },
      {
        title: "Invitations",
        url: "/invitations",
        icon: <MailIcon />,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Reports",
    defaultOpen: false,
    items: [
      { title: "Reports", url: "/reports", icon: <FileChartColumnIcon /> },
    ],
  },
  {
    label: "Account",
    defaultOpen: true,
    items: [
      { title: "Profile", url: "/profile", icon: <UserIcon /> },
      { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
      { title: "Notifications", url: "/notifications", icon: <BellIcon /> },
      { title: "Get Help", url: "/help", icon: <CircleHelpIcon /> },
      { title: "Search", url: "/search", icon: <SearchIcon /> },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean
}

export function AppSidebar({ isAdmin = false, ...props }: AppSidebarProps) {
  const {
    selectedOrganisation,
    organisations,
    user: authUser,
    logout,
  } = useAuth()
  const router = useRouter()
  const { can: checkPermission } = useAuth()

  const filteredSections = React.useMemo(() => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.adminOnly && !isAdmin) return false
          if (item.permissionKey) {
            return (
              checkPermission("read", item.permissionKey) ||
              checkPermission("*", item.permissionKey)
            )
          }
          return true
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [isAdmin, checkPermission])

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                <CommandIcon className="mr-2 h-4 w-4" />
                <span className="truncate text-base font-semibold">
                  {selectedOrganisation
                    ? organisations.find((o) => o.id === selectedOrganisation)
                        ?.name || "Organisation"
                    : "Select Organisation"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {filteredSections.map((section) => (
            <NavSection
              key={section.label}
              label={section.label}
              items={section.items}
              defaultOpen={section.defaultOpen}
            />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: authUser?.name || "User",
              email: authUser?.email || "",
              avatar: authUser?.avatar || undefined,
            }}
            onLogout={logout}
          />
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
