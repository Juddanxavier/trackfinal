"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-context"
import { AnimatedPage } from "@/components/animated-page"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import { orgSchema, branchSchema, fieldErrors } from "@/lib/validation"
import { api } from "@/lib/api"
import {
  Building2Icon,
  Loader2,
  GitBranchIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Trash2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DataTable, RowCheckbox, SelectAllCheckbox, type ColumnDef } from "@/components/data-table"
import { Empty, EmptyDescription } from "@/components/ui/empty"

interface Organisation {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  countryCode?: string | null
  currency?: string | null
  logoUrl?: string | null
  websiteUrl?: string | null
  trackingDomain?: string | null
  createdAt?: string
}

interface Branch {
  id: string
  organisationId: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  countryCode?: string | null
  isActive: boolean
  createdAt?: string
}

interface OrgFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  currency: string
}

interface BranchFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  isActive: boolean
}

const defaultOrgForm = (overrides?: Partial<OrgFormData>): OrgFormData => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "LK",
  currency: "LKR",
  ...overrides,
})

const defaultBranchForm = (overrides?: Partial<BranchFormData>): BranchFormData => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  isActive: true,
  ...overrides,
})

export default function OrganisationsPage() {
  const { can: checkPermission } = useAuth()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showEditOrg, setShowEditOrg] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)
  const [orgForm, setOrgForm] = useState<OrgFormData>(defaultOrgForm())
  const [orgErrors, setOrgErrors] = useState<Partial<Record<keyof OrgFormData, string>>>({})
  const [savingOrg, setSavingOrg] = useState(false)

  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [createBranchOrgId, setCreateBranchOrgId] = useState("")
  const [branchForm, setBranchForm] = useState<BranchFormData>(defaultBranchForm())
  const [branchErrors, setBranchErrors] = useState<Partial<Record<keyof BranchFormData, string>>>({})
  const [creatingBranch, setCreatingBranch] = useState(false)

  const [showEditBranch, setShowEditBranch] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [editBranchErrors, setEditBranchErrors] = useState<Partial<Record<keyof BranchFormData, string>>>({})
  const [branchDeactivateDialog, setBranchDeactivateDialog] = useState<{ open: boolean; branchId: string; branchName: string }>({ open: false, branchId: "", branchName: "" })
  const [orgDeleteDialog, setOrgDeleteDialog] = useState<{ open: boolean; orgId: string; orgName: string }>({ open: false, orgId: "", orgName: "" })
  const [editBranchForm, setEditBranchForm] = useState<BranchFormData>(defaultBranchForm())
  const [savingBranch, setSavingBranch] = useState(false)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const isAdmin =
    checkPermission("*", "organisations") ||
    checkPermission("write", "organisations")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orgRes, branchRes] = await Promise.all([
        api.get("/organisations") as any,
        expandedOrg ? api.get(`/organisations/${expandedOrg}/branches`) as any : Promise.resolve([]),
      ])
      const orgs = orgRes?.value || orgRes?.data || orgRes
      setOrganisations(Array.isArray(orgs) ? orgs : [])
      if (expandedOrg && Array.isArray(branchRes)) {
        setBranches(branchRes)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async (orgId: string) => {
    try {
      const res: any = await api.get(`/organisations/${orgId}/branches`)
      const branchList = Array.isArray(res) ? res : []
      setBranches(branchList)
      return branchList
    } catch {
      setBranches([])
      return []
    }
  }

  const toggleOrgExpand = async (orgId: string) => {
    if (expandedOrg === orgId) {
      setExpandedOrg(null)
      setBranches([])
    } else {
      setExpandedOrg(orgId)
      await fetchBranches(orgId)
    }
  }

  const filteredOrganisations = useMemo(() => {
    let result = [...organisations]
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (org) =>
          org.name.toLowerCase().includes(searchLower) ||
          (org.email && org.email.toLowerCase().includes(searchLower)) ||
          (org.city && org.city.toLowerCase().includes(searchLower))
      )
    }
    return result
  }, [organisations, search])

  const handleCreateOrg = async () => {
    const result = orgSchema.safeParse(orgForm)
    if (!result.success) {
      setOrgErrors(fieldErrors<OrgFormData>(result))
      return
    }
    setOrgErrors({})
    setSavingOrg(true)
    try {
      await api.post("/organisations", {
        ...result.data,
        slug: result.data.name.toLowerCase().replace(/\s+/g, "-"),
        email: result.data.email || null,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        state: result.data.state || null,
        postalCode: result.data.postalCode || null,
      })
      toast.success("Organisation created")
      setShowCreateOrg(false)
      setOrgForm(defaultOrgForm())
      setOrgErrors({})
      fetchData()
    } catch {
      toast.error("Failed to create organisation")
    } finally {
      setSavingOrg(false)
    }
  }

  const handleUpdateOrg = async () => {
    if (!editingOrg) return
    const result = orgSchema.safeParse(orgForm)
    if (!result.success) {
      setOrgErrors(fieldErrors<OrgFormData>(result))
      return
    }
    setOrgErrors({})
    setSavingOrg(true)
    try {
      await api.patch(`/organisations/${editingOrg.id}`, {
        ...result.data,
        email: result.data.email || null,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        state: result.data.state || null,
        postalCode: result.data.postalCode || null,
      })
      toast.success("Organisation updated")
      setShowEditOrg(false)
      setEditingOrg(null)
      setOrgErrors({})
      fetchData()
    } catch {
      toast.error("Failed to update organisation")
    } finally {
      setSavingOrg(false)
    }
  }


  const handleCreateBranch = async () => {
    if (!createBranchOrgId) return
    const result = branchSchema.safeParse(branchForm)
    if (!result.success) {
      setBranchErrors(fieldErrors<BranchFormData>(result))
      return
    }
    setBranchErrors({})
    setCreatingBranch(true)
    try {
      await api.post(`/organisations/${createBranchOrgId}/branches`, {
        ...result.data,
        email: result.data.email || null,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        state: result.data.state || null,
        postalCode: result.data.postalCode || null,
      })
      toast.success("Branch created")
      setShowCreateBranch(false)
      setBranchForm(defaultBranchForm())
      setBranchErrors({})
      await fetchBranches(expandedOrg!)
    } catch {
      toast.error("Failed to create branch")
    } finally {
      setCreatingBranch(false)
    }
  }

  const handleUpdateBranch = async () => {
    if (!editingBranch) return
    const result = branchSchema.safeParse(editBranchForm)
    if (!result.success) {
      setEditBranchErrors(fieldErrors<BranchFormData>(result))
      return
    }
    setEditBranchErrors({})
    setSavingBranch(true)
    try {
      await api.patch(`/organisations/${expandedOrg}/branches/${editingBranch.id}`, {
        ...result.data,
        email: result.data.email || null,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        state: result.data.state || null,
        postalCode: result.data.postalCode || null,
        isActive: editBranchForm.isActive,
      })
      toast.success("Branch updated")
      setShowEditBranch(false)
      setEditingBranch(null)
      setEditBranchErrors({})
      await fetchBranches(expandedOrg!)
    } catch {
      toast.error("Failed to update branch")
    } finally {
      setSavingBranch(false)
    }
  }

  const handleDeactivateBranch = async () => {
    const { branchId } = branchDeactivateDialog
    if (!branchId) return
    try {
      await api.delete(`/organisations/${expandedOrg}/branches/${branchId}`)
      toast.success("Branch deactivated")
      setBranchDeactivateDialog({ open: false, branchId: "", branchName: "" })
      await fetchBranches(expandedOrg!)
    } catch {
      toast.error("Failed to deactivate branch")
    }
  }

  const handleDeleteOrg = async () => {
    const { orgId } = orgDeleteDialog
    if (!orgId) return
    try {
      await api.delete(`/organisations/${orgId}`)
      toast.success("Organisation deleted")
      setOrgDeleteDialog({ open: false, orgId: "", orgName: "" })
      fetchData()
    } catch {
      toast.error("Failed to delete organisation")
    }
  }

  const openEditOrg = (org: Organisation) => {
    setEditingOrg(org)
    setOrgForm({
      name: org.name,
      email: org.email || "",
      phone: org.phone || "",
      address: org.address || "",
      city: org.city || "",
      state: org.state || "",
      postalCode: org.postalCode || "",
      countryCode: org.countryCode || "LK",
      currency: org.currency || "LKR",
    })
    setShowEditOrg(true)
  }

  const openCreateBranch = (orgId?: string) => {
    if (orgId) {
      setCreateBranchOrgId(orgId)
    } else {
      const firstOrg = organisations[0]
      if (firstOrg) setCreateBranchOrgId(firstOrg.id)
    }
    setBranchForm(defaultBranchForm())
    setShowCreateBranch(true)
  }

  const openEditBranch = (branch: Branch) => {
    setEditingBranch(branch)
    setEditBranchForm({
      name: branch.name,
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      postalCode: branch.postalCode || "",
      isActive: branch.isActive,
    })
    setShowEditBranch(true)
  }

  const orgCount = organisations.length
  const branchCount = branches.length

  const columns: ColumnDef<Organisation>[] = [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => { e.stopPropagation(); toggleOrgExpand(row.original.id) }}
        >
          {expandedOrg === row.original.id ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </Button>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email || "-"}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.phone || "-"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "countryCode",
      header: "Country",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.countryCode || "-"}
        </span>
      ),
      enableSorting: true,
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: Organisation } }) => {
              const org = row.original
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditOrg(org)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openCreateBranch(org.id)}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Branch
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => setOrgDeleteDialog({ open: true, orgId: org.id, orgName: org.name })}>
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            },
            enableSorting: false,
          } as ColumnDef<Organisation>,
        ]
      : []),
  ]

  return (
    <AnimatedPage className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
          <p className="text-muted-foreground mt-1">Manage organisations and branches</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {organisations.length > 0 && (
              <Button onClick={() => openCreateBranch()}>
                <GitBranchIcon className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            )}
          </div>
        )}
      </div>

      <StatsCardGrid columns={2}>
        <StatsCard
          title="Organizations"
          value={orgCount}
          icon={<Building2Icon className="size-5" />}
          color="blue"
          variant="inline"
        />
        <StatsCard
          title="Branches"
          value={branchCount}
          icon={<GitBranchIcon className="size-5" />}
          color="green"
          variant="inline"
        />
      </StatsCardGrid>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organisations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrganisations}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={
          <Empty>
            <EmptyDescription>No organisations found</EmptyDescription>
          </Empty>
        }
        enableRowSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        clientPageSize={10}
      />

      {expandedOrg && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Branches — {organisations.find((o) => o.id === expandedOrg)?.name}
            </h3>
          </div>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches</p>
          ) : (
            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <GitBranchIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[branch.city, branch.countryCode].filter(Boolean).join(", ") || "No location"}
                        {!branch.isActive && (
                          <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBranch(branch)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setBranchDeactivateDialog({ open: true, branchId: branch.id, branchName: branch.name })}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Organisation Dialog */}
      <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Organisation</DialogTitle>
            <DialogDescription>Create a new organisation</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={orgForm.name} onChange={(e) => { setOrgErrors({ ...orgErrors, name: undefined }); setOrgForm({ ...orgForm, name: e.target.value }) }} placeholder="Organisation name" />
              {orgErrors.name && <p className="text-sm text-red-500">{orgErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={orgForm.email} onChange={(e) => { setOrgErrors({ ...orgErrors, email: undefined }); setOrgForm({ ...orgForm, email: e.target.value }) }} placeholder="org@example.com" />
              {orgErrors.email && <p className="text-sm text-red-500">{orgErrors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={orgForm.phone} onChange={(e) => { setOrgErrors({ ...orgErrors, phone: undefined }); setOrgForm({ ...orgForm, phone: e.target.value }) }} onBlur={(e) => { const v = e.target.value; if (v) setOrgForm(f => ({ ...f, phone: prependCountryCode(v, f.countryCode) })) }} placeholder={getDialCode(orgForm.countryCode) + " 9000000000"} />
              {orgErrors.phone && <p className="text-sm text-red-500">{orgErrors.phone}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input value={orgForm.address} onChange={(e) => { setOrgErrors({ ...orgErrors, address: undefined }); setOrgForm({ ...orgForm, address: e.target.value }) }} placeholder="123 Main St" />
              {orgErrors.address && <p className="text-sm text-red-500">{orgErrors.address}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={orgForm.city} onChange={(e) => { setOrgErrors({ ...orgErrors, city: undefined }); setOrgForm({ ...orgForm, city: e.target.value }) }} placeholder="Colombo" />
                {orgErrors.city && <p className="text-sm text-red-500">{orgErrors.city}</p>}
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input value={orgForm.state} onChange={(e) => { setOrgErrors({ ...orgErrors, state: undefined }); setOrgForm({ ...orgForm, state: e.target.value }) }} placeholder="Western" />
                {orgErrors.state && <p className="text-sm text-red-500">{orgErrors.state}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Postal Code</Label>
                <Input value={orgForm.postalCode} onChange={(e) => { setOrgErrors({ ...orgErrors, postalCode: undefined }); setOrgForm({ ...orgForm, postalCode: e.target.value }) }} placeholder="00100" />
                {orgErrors.postalCode && <p className="text-sm text-red-500">{orgErrors.postalCode}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select value={orgForm.countryCode} onValueChange={(v) => setOrgForm({ ...orgForm, countryCode: v })}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {[{ code: "LK", name: "Sri Lanka" }, { code: "US", name: "United States" }, { code: "IN", name: "India" }, { code: "GB", name: "United Kingdom" }, { code: "AE", name: "UAE" }].map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={orgForm.currency} onValueChange={(v) => setOrgForm({ ...orgForm, currency: v })}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {[{ code: "LKR", name: "Rupee", symbol: "Rs" }, { code: "USD", name: "US Dollar", symbol: "$" }, { code: "INR", name: "Indian Rupee", symbol: "₹" }, { code: "GBP", name: "British Pound", symbol: "£" }, { code: "AED", name: "Dirham", symbol: "د.إ" }].map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateOrg(false); setOrgErrors({}) }}>Cancel</Button>
            <Button onClick={handleCreateOrg} disabled={savingOrg}>
              {savingOrg ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Organisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organisation Dialog */}
      <Dialog open={showEditOrg} onOpenChange={setShowEditOrg}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organisation</DialogTitle>
            <DialogDescription>Update organisation details</DialogDescription>
          </DialogHeader>
          {editingOrg && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input value={orgForm.name} onChange={(e) => { setOrgErrors({ ...orgErrors, name: undefined }); setOrgForm({ ...orgForm, name: e.target.value })} } />
                {orgErrors.name && <p className="text-sm text-red-500">{orgErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={orgForm.email} onChange={(e) => { setOrgErrors({ ...orgErrors, email: undefined }); setOrgForm({ ...orgForm, email: e.target.value })} } />
                {orgErrors.email && <p className="text-sm text-red-500">{orgErrors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={orgForm.phone} onChange={(e) => { setOrgErrors({ ...orgErrors, phone: undefined }); setOrgForm({ ...orgForm, phone: e.target.value })} } onBlur={(e) => { const v = e.target.value; if (v) setOrgForm(f => ({ ...f, phone: prependCountryCode(v, f.countryCode) })) }} placeholder={getDialCode(orgForm.countryCode) + " 9000000000"} />
                {orgErrors.phone && <p className="text-sm text-red-500">{orgErrors.phone}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={orgForm.address} onChange={(e) => { setOrgErrors({ ...orgErrors, address: undefined }); setOrgForm({ ...orgForm, address: e.target.value })} } />
                {orgErrors.address && <p className="text-sm text-red-500">{orgErrors.address}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input value={orgForm.city} onChange={(e) => { setOrgErrors({ ...orgErrors, city: undefined }); setOrgForm({ ...orgForm, city: e.target.value })} } />
                  {orgErrors.city && <p className="text-sm text-red-500">{orgErrors.city}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input value={orgForm.state} onChange={(e) => { setOrgErrors({ ...orgErrors, state: undefined }); setOrgForm({ ...orgForm, state: e.target.value })} } />
                  {orgErrors.state && <p className="text-sm text-red-500">{orgErrors.state}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Postal Code</Label>
                  <Input value={orgForm.postalCode} onChange={(e) => { setOrgErrors({ ...orgErrors, postalCode: undefined }); setOrgForm({ ...orgForm, postalCode: e.target.value })} } />
                  {orgErrors.postalCode && <p className="text-sm text-red-500">{orgErrors.postalCode}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Select value={orgForm.countryCode} onValueChange={(v) => setOrgForm({ ...orgForm, countryCode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[{ code: "LK", name: "Sri Lanka" }, { code: "US", name: "United States" }, { code: "IN", name: "India" }, { code: "GB", name: "United Kingdom" }, { code: "AE", name: "UAE" }].map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={orgForm.currency} onValueChange={(v) => setOrgForm({ ...orgForm, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[{ code: "LKR", name: "Rupee", symbol: "Rs" }, { code: "USD", name: "US Dollar", symbol: "$" }, { code: "INR", name: "Indian Rupee", symbol: "₹" }, { code: "GBP", name: "British Pound", symbol: "£" }, { code: "AED", name: "Dirham", symbol: "د.إ" }].map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditOrg(false); setEditingOrg(null); setOrgErrors({}) }}>Cancel</Button>
            <Button onClick={handleUpdateOrg} disabled={savingOrg}>
              {savingOrg ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Branch Dialog */}
      <Dialog open={showCreateBranch} onOpenChange={setShowCreateBranch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription>Create a new branch</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Branch Name *</Label>
              <Input value={branchForm.name} onChange={(e) => { setBranchErrors({ ...branchErrors, name: undefined }); setBranchForm({ ...branchForm, name: e.target.value }) }} placeholder="e.g., Colombo Central" />
              {branchErrors.name && <p className="text-sm text-red-500">{branchErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={branchForm.email} onChange={(e) => { setBranchErrors({ ...branchErrors, email: undefined }); setBranchForm({ ...branchForm, email: e.target.value }) }} placeholder="branch@example.com" />
              {branchErrors.email && <p className="text-sm text-red-500">{branchErrors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={branchForm.phone} onChange={(e) => { setBranchErrors({ ...branchErrors, phone: undefined }); setBranchForm({ ...branchForm, phone: e.target.value }) }} onBlur={(e) => { const v = e.target.value; if (v) { const orgCc = organisations.find(o => o.id === expandedOrg)?.countryCode || "LK"; setBranchForm(f => ({ ...f, phone: prependCountryCode(v, orgCc) })) } }} placeholder={getDialCode(organisations.find(o => o.id === expandedOrg)?.countryCode || "LK") + " 9000000000"} />
              {branchErrors.phone && <p className="text-sm text-red-500">{branchErrors.phone}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input value={branchForm.address} onChange={(e) => { setBranchErrors({ ...branchErrors, address: undefined }); setBranchForm({ ...branchForm, address: e.target.value }) }} placeholder="123 Main St" />
              {branchErrors.address && <p className="text-sm text-red-500">{branchErrors.address}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={branchForm.city} onChange={(e) => { setBranchErrors({ ...branchErrors, city: undefined }); setBranchForm({ ...branchForm, city: e.target.value }) }} placeholder="Colombo" />
                {branchErrors.city && <p className="text-sm text-red-500">{branchErrors.city}</p>}
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input value={branchForm.state} onChange={(e) => { setBranchErrors({ ...branchErrors, state: undefined }); setBranchForm({ ...branchForm, state: e.target.value }) }} />
                {branchErrors.state && <p className="text-sm text-red-500">{branchErrors.state}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Postal Code</Label>
                <Input value={branchForm.postalCode} onChange={(e) => { setBranchErrors({ ...branchErrors, postalCode: undefined }); setBranchForm({ ...branchForm, postalCode: e.target.value }) }} />
                {branchErrors.postalCode && <p className="text-sm text-red-500">{branchErrors.postalCode}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateBranch(false); setBranchErrors({}) }}>Cancel</Button>
            <Button onClick={handleCreateBranch} disabled={creatingBranch}>
              {creatingBranch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditBranch} onOpenChange={setShowEditBranch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch details</DialogDescription>
          </DialogHeader>
          {editingBranch && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Branch Name *</Label>
                <Input value={editBranchForm.name} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, name: undefined }); setEditBranchForm({ ...editBranchForm, name: e.target.value }) }} />
                {editBranchErrors.name && <p className="text-sm text-red-500">{editBranchErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={editBranchForm.email} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, email: undefined }); setEditBranchForm({ ...editBranchForm, email: e.target.value }) }} />
                {editBranchErrors.email && <p className="text-sm text-red-500">{editBranchErrors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={editBranchForm.phone} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, phone: undefined }); setEditBranchForm({ ...editBranchForm, phone: e.target.value }) }} onBlur={(e) => { const v = e.target.value; if (v) { const orgCc = organisations.find(o => o.id === expandedOrg)?.countryCode || "LK"; setEditBranchForm(f => ({ ...f, phone: prependCountryCode(v, orgCc) })) } }} placeholder={getDialCode(organisations.find(o => o.id === expandedOrg)?.countryCode || "LK") + " 9000000000"} />
                {editBranchErrors.phone && <p className="text-sm text-red-500">{editBranchErrors.phone}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={editBranchForm.address} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, address: undefined }); setEditBranchForm({ ...editBranchForm, address: e.target.value }) }} />
                {editBranchErrors.address && <p className="text-sm text-red-500">{editBranchErrors.address}</p>}
              </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={editBranchForm.city} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, city: undefined }); setEditBranchForm({ ...editBranchForm, city: e.target.value }) }} />
                {editBranchErrors.city && <p className="text-sm text-red-500">{editBranchErrors.city}</p>}
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input value={editBranchForm.state} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, state: undefined }); setEditBranchForm({ ...editBranchForm, state: e.target.value }) }} />
                {editBranchErrors.state && <p className="text-sm text-red-500">{editBranchErrors.state}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Postal Code</Label>
                <Input value={editBranchForm.postalCode} onChange={(e) => { setEditBranchErrors({ ...editBranchErrors, postalCode: undefined }); setEditBranchForm({ ...editBranchForm, postalCode: e.target.value }) }} />
                {editBranchErrors.postalCode && <p className="text-sm text-red-500">{editBranchErrors.postalCode}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="branch-active" checked={editBranchForm.isActive} onChange={(e) => setEditBranchForm({ ...editBranchForm, isActive: e.target.checked })} className="size-4 rounded border-gray-300" />
              <Label htmlFor="branch-active" className="text-sm font-normal">Active</Label>
            </div>
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditBranch(false); setEditingBranch(null); setEditBranchErrors({}) }}>Cancel</Button>
            <Button onClick={handleUpdateBranch} disabled={savingBranch}>
              {savingBranch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={branchDeactivateDialog.open} onOpenChange={(open) => setBranchDeactivateDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <strong>{branchDeactivateDialog.branchName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDeactivateDialog({ open: false, branchId: "", branchName: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateBranch}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orgDeleteDialog.open} onOpenChange={(open) => setOrgDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organisation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{orgDeleteDialog.orgName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgDeleteDialog({ open: false, orgId: "", orgName: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
