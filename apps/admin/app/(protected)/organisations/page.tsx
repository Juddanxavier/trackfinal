"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-context"
import { AnimatedPage } from "@/components/animated-page"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"
import { api } from "@/lib/api"
import {
  Building2Icon,
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
import { toast } from "sonner"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import { OrgFormDialog } from "@/components/organisations/org-form-dialog"
import { BranchFormDialog } from "@/components/organisations/branch-form-dialog"

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

  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [createBranchOrgId, setCreateBranchOrgId] = useState("")
  const [showEditBranch, setShowEditBranch] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [branchDeactivateDialog, setBranchDeactivateDialog] = useState<{
    open: boolean
    branchId: string
    branchName: string
  }>({ open: false, branchId: "", branchName: "" })
  const [orgDeleteDialog, setOrgDeleteDialog] = useState<{
    open: boolean
    orgId: string
    orgName: string
  }>({ open: false, orgId: "", orgName: "" })

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
        expandedOrg
          ? (api.get(`/organisations/${expandedOrg}/branches`) as any)
          : Promise.resolve([]),
      ])
      const orgs = orgRes?.value || orgRes?.data || orgRes
      setOrganisations(Array.isArray(orgs) ? orgs : [])
      if (expandedOrg && Array.isArray(branchRes)) {
        setBranches(branchRes)
      }
    } catch (error) {
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
    setShowEditOrg(true)
  }
  const openCreateBranch = (orgId?: string) => {
    if (orgId) setCreateBranchOrgId(orgId)
    setShowCreateBranch(true)
  }
  const openEditBranch = (branch: Branch) => {
    setEditingBranch(branch)
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
          onClick={(e) => {
            e.stopPropagation()
            toggleOrgExpand(row.original.id)
          }}
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
        <span className="text-muted-foreground">
          {row.original.email || "-"}
        </span>
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
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() =>
                        setOrgDeleteDialog({
                          open: true,
                          orgId: org.id,
                          orgName: org.name,
                        })
                      }
                    >
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
    <AnimatedPage className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
          <p className="mt-1 text-muted-foreground">
            Manage organisations and branches
          </p>
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

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organisations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrganisations}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={<EmptyState entity="organisations" />}
        enableRowSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        clientPageSize={10}
      />

      {expandedOrg && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
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
                        {[branch.city, branch.countryCode]
                          .filter(Boolean)
                          .join(", ") || "No location"}
                        {!branch.isActive && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditBranch(branch)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() =>
                          setBranchDeactivateDialog({
                            open: true,
                            branchId: branch.id,
                            branchName: branch.name,
                          })
                        }
                      >
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

      <OrgFormDialog
        open={showCreateOrg}
        onOpenChange={setShowCreateOrg}
        onSaved={fetchData}
      />
      <OrgFormDialog
        open={showEditOrg}
        onOpenChange={(o) => {
          setShowEditOrg(o)
          if (!o) setEditingOrg(null)
        }}
        onSaved={fetchData}
        orgId={editingOrg?.id}
        initial={
          editingOrg
            ? {
                name: editingOrg.name,
                email: editingOrg.email || "",
                phone: editingOrg.phone || "",
                address: editingOrg.address || "",
                city: editingOrg.city || "",
                state: editingOrg.state || "",
                postalCode: editingOrg.postalCode || "",
                countryCode: editingOrg.countryCode || "LK",
                currency: editingOrg.currency || "LKR",
              }
            : null
        }
      />
      <BranchFormDialog
        open={showCreateBranch}
        onOpenChange={setShowCreateBranch}
        onSaved={() => fetchBranches(expandedOrg!)}
        organisationId={createBranchOrgId || expandedOrg || ""}
        orgCountryCode={
          organisations.find((o) => o.id === expandedOrg)?.countryCode ||
          undefined
        }
      />
      <BranchFormDialog
        open={showEditBranch}
        onOpenChange={(o) => {
          setShowEditBranch(o)
          if (!o) setEditingBranch(null)
        }}
        onSaved={() => fetchBranches(expandedOrg!)}
        organisationId={expandedOrg ?? ""}
        orgCountryCode={
          organisations.find((o) => o.id === expandedOrg)?.countryCode ??
          undefined
        }
        branchId={editingBranch?.id ?? undefined}
        initialIsActive={editingBranch?.isActive ?? true}
        initial={
          editingBranch
            ? {
                name: editingBranch.name,
                email: editingBranch.email || "",
                phone: editingBranch.phone || "",
                address: editingBranch.address || "",
                city: editingBranch.city || "",
                state: editingBranch.state || "",
                postalCode: editingBranch.postalCode || "",
              }
            : null
        }
      />

      <Dialog
        open={branchDeactivateDialog.open}
        onOpenChange={(open) =>
          setBranchDeactivateDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{branchDeactivateDialog.branchName}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setBranchDeactivateDialog({
                  open: false,
                  branchId: "",
                  branchName: "",
                })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateBranch}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={orgDeleteDialog.open}
        onOpenChange={(open) =>
          setOrgDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organisation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{orgDeleteDialog.orgName}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setOrgDeleteDialog({ open: false, orgId: "", orgName: "" })
              }
            >
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
