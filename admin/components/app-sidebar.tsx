"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  FileChartColumnIcon,
  TruckIcon,
  BellIcon,
  ChevronDownIcon,
  LayoutIcon,
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
  isActive?: boolean
  createdAt?: string
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Quotes",
      url: "/quotes",
      icon: <FileTextIcon />,
    },
    {
      title: "Shipments",
      url: "/shipments",
      icon: <TruckIcon />,
    },
    {
      title: "Users",
      url: "/users",
      icon: <UsersIcon />,
    },
    {
      title: "Invitations",
      url: "/invitations",
      icon: <MailIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: <BellIcon />,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "/search",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "/reports",
      icon: <FileChartColumnIcon />,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organisations?: Organisation[]
  selectedOrganisation?: string
  onOrganisationChange?: (orgId: string) => void
  isAdmin?: boolean
}

export function AppSidebar({
  organisations = [],
  selectedOrganisation,
  onOrganisationChange,
  isAdmin = false,
  ...props
}: AppSidebarProps & { isAdmin?: boolean }) {
  const currentOrg = organisations.find(
    (org) => org.id === selectedOrganisation
  ) || organisations[0]
  const showOrgSelector = isAdmin && organisations.length > 1

  let displayName = currentOrg?.name
  if (!displayName && selectedOrganisation) {
    displayName = "Org: " + selectedOrganisation.slice(0, 8)
  }
  if (!displayName) {
    displayName = showOrgSelector ? "Select Org" : "My Organisation"
  }

if (!showOrgSelector) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                <span className="truncate text-base font-semibold">
                  {displayName}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavDocuments items={data.documents} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                  <span className="truncate text-base font-semibold">
                    {displayName}
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-48">
                {organisations.length === 0 ? (
                  <DropdownMenuItem disabled>No organisations</DropdownMenuItem>
                ) : (
                  organisations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => onOrganisationChange?.(org.id)}
                      className={
                        selectedOrganisation === org.id ? "bg-accent" : ""
                      }
                    >
                      {org.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
