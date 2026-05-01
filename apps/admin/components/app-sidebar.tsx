"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
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
  CommandIcon,
  UserIcon,
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
      title: "Profile",
      url: "/profile",
      icon: <UserIcon />,
    },
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
}: AppSidebarProps) {
  const router = useRouter()
  const [openQuickCreate, setOpenQuickCreate] = useState(false)
  const [quickForm, setQuickForm] = useState({ trackingNumber: "", recipientName: "", recipientPhone: "", recipientEmail: "" })
  const [creating, setCreating] = useState(false)

  const handleQuickCreate = async () => {
    if (!quickForm.trackingNumber || !quickForm.recipientName || !quickForm.recipientPhone) {
      toast.error("Please fill in tracking number, recipient name, and phone")
      return
    }
    setCreating(true)
    try {
      let phone = quickForm.recipientPhone.replace(/\s/g, "")
      if (!phone.startsWith("+")) {
        phone = "+1" + phone
      }
      await api.post("/shipments", {
        trackingNumber: quickForm.trackingNumber,
        carrierCode: "unknown",
        recipientName: quickForm.recipientName,
        recipientEmail: quickForm.recipientEmail || undefined,
        recipientPhone: phone,
      }, { throwOnError: false, timeout: 30000 })
      toast.success("Shipment created successfully")
      setOpenQuickCreate(false)
      setQuickForm({ trackingNumber: "", recipientName: "", recipientPhone: "", recipientEmail: "" })
      router.push("/shipments")
    } catch (err) {
      toast.error("Failed to create shipment")
    } finally {
      setCreating(false)
    }
  }

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

  return (
    <>
      <Dialog open={openQuickCreate} onOpenChange={setOpenQuickCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Create Shipment</DialogTitle>
            <DialogDescription>Enter shipment details to create a new shipment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="qc-tracking">Tracking Number *</Label>
              <Input id="qc-tracking" placeholder="Enter tracking number" value={quickForm.trackingNumber} onChange={(e) => setQuickForm(p => ({ ...p, trackingNumber: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qc-name">Recipient Name *</Label>
              <Input id="qc-name" placeholder="Enter recipient name" value={quickForm.recipientName} onChange={(e) => setQuickForm(p => ({ ...p, recipientName: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qc-phone">Phone *</Label>
              <Input id="qc-phone" placeholder="Enter phone number" value={quickForm.recipientPhone} onChange={(e) => setQuickForm(p => ({ ...p, recipientPhone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qc-email">Email</Label>
              <Input id="qc-email" type="email" placeholder="Enter email (optional)" value={quickForm.recipientEmail} onChange={(e) => setQuickForm(p => ({ ...p, recipientEmail: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenQuickCreate(false)}>Cancel</Button>
            <Button onClick={handleQuickCreate} disabled={creating || !quickForm.trackingNumber || !quickForm.recipientName || !quickForm.recipientPhone}>
              {creating ? "Creating..." : "Create Shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sidebar collapsible="icon" {...props}>
        {showOrgSelector ? (
          <>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                        <CommandIcon className="mr-2 h-4 w-4" />
                        <span className="truncate text-base font-semibold">
                          {displayName}
                        </span>
                        <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
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
              <NavMain items={data.navMain} onQuickCreate={() => setOpenQuickCreate(true)} />
              <NavDocuments items={data.documents} />
              <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
          </>
        ) : (
          <>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                    <CommandIcon className="mr-2 h-4 w-4" />
                    <span className="truncate text-base font-semibold">
                      {displayName}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <NavMain items={data.navMain} onQuickCreate={() => setOpenQuickCreate(true)} />
              <NavDocuments items={data.documents} />
              <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
          </>
        )}
      </Sidebar>
    </>
  )
}