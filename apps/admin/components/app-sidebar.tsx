"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import { z } from "zod"
import { getDialCode, prependCountryCode } from "@/lib/phone"

// Input validation schemas
const quickTrackingSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-]+$/)
const quickNameSchema = z.string().min(1).max(200)
const quickPhoneSchema = z.string().regex(/^[\d\s\-+()]+$/).max(20)
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
  LayoutIcon,
  MailIcon,
  CommandIcon,
  UserIcon,
  Building2Icon,
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
      title: "Organisations",
      url: "/organisations",
      icon: <Building2Icon />,
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
  isAdmin?: boolean
}

export function AppSidebar({
  isAdmin = false,
  ...props
}: AppSidebarProps) {
  const { selectedOrganisation, organisations } = useAuth()
  const router = useRouter()
  const { can: checkPermission } = useAuth()
  const [openQuickCreate, setOpenQuickCreate] = useState(false)

  const filteredNavMain = React.useMemo(() => {
    return data.navMain.filter(item => {
      const permKey = item.url.replace('/', '')
      // Hide organisations page for non-admins
      if (permKey === 'organisations' && !isAdmin) return false
      // Hide invitations page for non-admin users (staff cannot invite)
      if (permKey === 'invitations' && !isAdmin) return false
      if (isAdmin) return true
      return checkPermission('read', permKey) || checkPermission('*', permKey)
    })
  }, [isAdmin, checkPermission])
  const [quickForm, setQuickForm] = useState({ trackingNumber: "", recipientName: "", recipientPhone: "", recipientEmail: "" })
  const [creating, setCreating] = useState(false)

  const handleQuickCreate = async () => {
    // Validate inputs using Zod schemas
    try {
      quickTrackingSchema.parse(quickForm.trackingNumber)
      quickNameSchema.parse(quickForm.recipientName)
      quickPhoneSchema.parse(quickForm.recipientPhone)
    } catch (validationErr: any) {
      const field = validationErr?.issues?.[0]?.path?.[0] || "input"
      toast.error(`Invalid ${field}`)
      return
    }
    
    if (!selectedOrganisation) {
      toast.error("Please select an organisation first")
      return
    }
    setCreating(true)
    try {
      const orgCode = organisations.find(o => o.id === selectedOrganisation)?.countryCode || ""
      let phone = prependCountryCode(quickForm.recipientPhone, orgCode)
      await api.post("/shipments", {
        trackingNumber: quickForm.trackingNumber,
        carrierCode: "unknown",
        recipientName: quickForm.recipientName,
        recipientEmail: quickForm.recipientEmail || undefined,
        recipientPhone: phone,
        organisationId: selectedOrganisation,
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

  // Use selectedOrganisation from auth-context for quick create

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
              <Input id="qc-phone" placeholder={getDialCode(organisations.find(o => o.id === selectedOrganisation)?.countryCode || "") + " 9000000000"} value={quickForm.recipientPhone} onChange={(e) => setQuickForm(p => ({ ...p, recipientPhone: e.target.value }))} onBlur={(e) => { const v = e.target.value; if (v) { const cc = organisations.find(o => o.id === selectedOrganisation)?.countryCode || ""; setQuickForm(p => ({ ...p, recipientPhone: prependCountryCode(v, cc) })) } }} />
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
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="w-full data-[slot=sidebar-menu-button]:p-1.5!">
                <CommandIcon className="mr-2 h-4 w-4" />
                <span className="truncate text-base font-semibold">
                  {selectedOrganisation ? organisations.find(o => o.id === selectedOrganisation)?.name || "Organisation" : "Select Organisation"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={filteredNavMain} onQuickCreate={() => setOpenQuickCreate(true)} />
          <NavDocuments items={data.documents} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      </Sidebar>
    </>
  )
}