"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusIcon, TrashIcon, Loader2, MailIcon, SearchIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ShieldIcon, UsersIcon, GitBranchIcon } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"
import { DataTable, RowCheckbox, SelectAllCheckbox, type ColumnDef, type SortingState } from "@/components/data-table"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BulkActionFooter } from "@/components/bulk-action-footer"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { toast } from "sonner"

interface Invitation {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
  organisationId: string
  organisationName: string
  branchId?: string | null
  branchName?: string
  acceptedAt?: string | null
}

interface Branch {
  id: string
  name: string
}

export default function InvitationsPage() {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff")
  const [inviteBranchId, setInviteBranchId] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [inviting, setInviting] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    fetchInvitations()
  }, [page, search, statusFilter, roleFilter, sorting, limit])

  useEffect(() => {
    if (!inviteDialogOpen || !user?.organisationId) return
    setInviteBranchId("")
    api
      .get<Branch[]>(`/organisations/${user.organisationId}/branches`)
      .then((res) => setBranches(res || []))
      .catch(() => setBranches([]))
  }, [inviteDialogOpen])

  const fetchInvitations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id)
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res: any = await api.get(`/auth/invitations?${params}`, { throwOnError: false })
      const data = res?.data || res?.value || []
      const totalCount = res?.total ?? data.length
      const apiPages = res?.totalPages ?? 0
      const pagesCount = totalCount > limit ? Math.max(2, apiPages) : 1
      setInvitations(data)
      setTotal(totalCount)
      setTotalPages(pagesCount)
    } catch (err) {
      console.error("Failed to fetch invitations:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return

    const emailExists = invitations.some(inv => inv.email.toLowerCase() === inviteEmail.toLowerCase() && !inv.acceptedAt)
    if (emailExists) {
      toast.error("An invitation is already pending for this email")
      return
    }

    try {
      const userCheck: any = await api.get(`/users/by-email?email=${encodeURIComponent(inviteEmail)}`, { throwOnError: false })
      if (userCheck && userCheck.exists === true) {
        toast.error("A user with this email already exists in the system")
        return
      }
    } catch {
      // User doesn't exist, continue
    }

    setInviting(true)
    try {
      await api.post("/auth/invitations", {
        email: inviteEmail,
        role: inviteRole,
        branchId: inviteBranchId || null,
      })
      toast.success("Invitation sent")
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("staff")
      setInviteBranchId("")
      fetchInvitations()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to send invitation"
      toast.error(msg)
    } finally {
      setInviting(false)
    }
  }

  const handleDeleteClick = (inv: Invitation) => {
    setInvitationToDelete(inv)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!invitationToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/auth/invitations/${invitationToDelete.id}`)
      toast.success("Invitation cancelled")
      setDeleteDialogOpen(false)
      setInvitationToDelete(null)
      fetchInvitations()
    } catch (err) {
      toast.error("Failed to cancel invitation")
    } finally {
      setDeleting(false)
    }
  }

  const handleResend = async (id: string) => {
    try {
      await api.post(`/auth/invitations/${id}/resend`)
      toast.success("Invitation resent")
    } catch (err) {
      toast.error("Failed to resend invitation")
    }
  }

  const now = new Date()
  const pendingCount = invitations.filter(i => new Date(i.expiresAt) > now && !i.acceptedAt).length
  const acceptedCount = invitations.filter(i => i.acceptedAt).length
  const expiredCount = invitations.filter(i => new Date(i.expiresAt) <= now && !i.acceptedAt).length

  const columns: ColumnDef<Invitation>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <SelectAllCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        />
      ),
      cell: ({ row }) => (
        <RowCheckbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "staff" ? "default" : "secondary"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorFn: (row) => row.branchName,
      id: "branch",
      header: "Branch",
      cell: ({ row }) =>
        row.original.branchName ? (
          <Badge variant="outline">{row.original.branchName}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      enableSorting: false,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const inv = row.original
        const isExpired = new Date(inv.expiresAt) <= now
        const isAccepted = !!inv.acceptedAt
        return (
          <Badge
            variant={
              isAccepted ? "outline" : isExpired ? "destructive" : "default"
            }
          >
            {isAccepted ? "Accepted" : isExpired ? "Expired" : "Pending"}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: "Sent",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) =>
        new Date(row.original.expiresAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const inv = row.original
        const isExpired = new Date(inv.expiresAt) <= now
        const isAccepted = !!inv.acceptedAt
        if (isAccepted) return null
        return (
          <div className="flex items-center gap-1">
            {!isExpired && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleResend(inv.id)
                }}
                title="Resend"
              >
                <MailIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteClick(inv)
              }}
              title="Cancel"
            >
              <TrashIcon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  return (
    <AnimatedPage className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground mt-1">Manage user invitations</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send an invitation to join your organisation.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v: string) => {
                  if (v === "admin" || v === "staff") setInviteRole(v)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        Staff
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Branch (Optional)</Label>
                <Select
                  value={inviteBranchId || "none"}
                  onValueChange={(v) => setInviteBranchId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <GitBranchIcon className="h-4 w-4" />
                        All Branches
                      </div>
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <StatsCardGrid>
        <StatsCard
          title="Pending"
          value={pendingCount}
          icon={<ClockIcon className="h-5 w-5" />}
          color="blue"
          variant="inline"
        />
        <StatsCard
          title="Accepted"
          value={acceptedCount}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          color="green"
          variant="inline"
        />
        <StatsCard
          title="Expired"
          value={expiredCount}
          icon={<XCircleIcon className="h-5 w-5" />}
          color="red"
          variant="inline"
        />
        <StatsCard
          title="Total"
          value={invitations.length}
          icon={<MailIcon className="h-5 w-5" />}
          color="purple"
          variant="inline"
        />
      </StatsCardGrid>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={invitations}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={
          <Empty>
            <EmptyDescription>No invitations found</EmptyDescription>
          </Empty>
        }
        enableRowSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        manualPagination
        page={page}
        pageSize={limit}
        total={total}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        pageSizeOptions={[10, 20, 50, 100]}
        customFooter={<BulkActionFooter
          selectedCount={selectedIds.length}
          actions={[
            { label: "Resend", variant: "outline", onClick: () => {
              selectedIds.forEach(id => handleResend(id))
              setSelectedIds([])
            }},
            { label: "Cancel", variant: "destructive", onClick: () => {
              selectedIds.forEach(id => {
                const inv = invitations.find(i => i.id === id)
                if (inv) handleDeleteClick(inv)
              })
              setSelectedIds([])
            }},
          ]}
        />}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Cancel Invitation"
        description={`Are you sure you want to cancel the invitation sent to ${invitationToDelete?.email}? This action cannot be undone.`}
        confirmLabel="Cancel Invitation"
        variant="destructive"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </AnimatedPage>
  )
}