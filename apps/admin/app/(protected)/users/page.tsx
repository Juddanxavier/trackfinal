"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { BulkActionFooter } from "@/components/bulk-action-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { userEditSchema, type UserEditFormData } from "@/lib/validation"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AnimatedPage } from "@/components/animated-page"
import { StatsCard, StatsCardGrid } from "@/components/stats-card"
import {
  DataTable,
  RowCheckbox,
  SelectAllCheckbox,
  type ColumnDef,
  type SortingState,
} from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { useSocketRefresh } from "@/lib/hooks/use-socket-refresh"
import {
  SearchIcon,
  Loader2,
  UsersIcon,
  UserCheckIcon,
  ShieldIcon,
  UserPlusIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  UserMinusIcon,
  MailIcon,
  PhoneIcon,
  Building2Icon,
} from "lucide-react"
import { ExportButton } from "@/components/export-button"

interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string | null
  role: string
  isActive: boolean
  organisationId: string
  createdAt: string
  branchId?: string | null
  [key: string]: unknown
}

interface Stats {
  total: number
  active: number
  customers: number
  staff: number
}

interface Branch {
  id: string
  name: string
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    staff:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    customer:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800",
  }
  return (
    <Badge variant="outline" className={styles[role] || styles.customer}>
      {role}
    </Badge>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      variant="outline"
      className="border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20"
    >
      Active
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900/20"
    >
      Inactive
    </Badge>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const {
    user,
    selectedOrganisation,
    isLoading: authLoading,
    organisations,
  } = useAuth()

  const isGlobalAdmin = user?.role === "global_admin"
  const isAdmin = user?.role === "admin" || isGlobalAdmin

  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [branches, setBranches] = useState<Branch[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [orgFilter, setOrgFilter] = useState(selectedOrganisation || "")

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [editBranches, setEditBranches] = useState<Branch[]>([])

  const editForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
  })
  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    control: editControl,
    reset: editReset,
    formState: { errors: editErrors },
  } = editForm

  const isMultiOrg = isGlobalAdmin && organisations.length > 1

  const orgMap = useMemo(() => {
    const map = new Map<string, string>()
    organisations.forEach((org) => map.set(org.id, org.name))
    return map
  }, [organisations])

  const branchMap = useMemo(() => {
    const map = new Map<string, string>()
    branches.forEach((b) => map.set(b.id, b.name))
    return map
  }, [branches])

  const fetchUsers = async () => {
    if (authLoading) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (statusFilter !== "all")
        params.set("isActive", statusFilter === "active" ? "true" : "false")

      // Use branch filter from page
      const branchId = branchFilter !== "all" ? branchFilter : null
      if (branchId) params.set("branchId", branchId)

      // Determine organisation
      const orgId =
        isGlobalAdmin && orgFilter ? orgFilter : selectedOrganisation
      if (orgId) params.set("organisationId", orgId)
      if (isAdmin) params.set("all", "true")
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id)
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const res = await api.get<{
        data: User[]
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/users?${params}`, { throwOnError: false })
      if (res) {
        setUsers(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      }
    } catch (err) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    const orgId = isGlobalAdmin && orgFilter ? orgFilter : selectedOrganisation
    if (!orgId) {
      setBranches([])
      return
    }
    try {
      const res = await api.get<Branch[]>(`/organisations/${orgId}/branches`, {
        throwOnError: false,
      })
      if (res) setBranches(res)
    } catch (err) {
      toast.error("Failed to fetch branches")
    }
  }

  const fetchStats = async () => {
    if (authLoading) return
    try {
      const params = new URLSearchParams()
      const orgId =
        isGlobalAdmin && orgFilter ? orgFilter : selectedOrganisation
      if (orgId) params.set("organisationId", orgId)
      const queryString = params.toString() ? `?${params.toString()}` : ""
      const res = await api.get<Stats>(`/users/stats${queryString}`, {
        throwOnError: false,
      })
      if (res) setStats(res)
    } catch (err) {
      toast.error("Failed to fetch stats")
    }
  }

  useSocketRefresh("users", fetchUsers, !loading)

  // Fetch branches when org changes
  useEffect(() => {
    const orgId = isGlobalAdmin && orgFilter ? orgFilter : selectedOrganisation
    if (orgId) fetchBranches()
  }, [selectedOrganisation, orgFilter, isGlobalAdmin])

  // Search/filter changes - reset to page 1
  useEffect(() => {
    setPage(1)
    fetchUsers()
  }, [search, branchFilter, statusFilter, roleFilter])

  // Page/other params changes
  useEffect(() => {
    fetchUsers()
  }, [
    page,
    limit,
    sorting,
    selectedOrganisation,
    orgFilter,
    user,
    authLoading,
    isGlobalAdmin,
    isAdmin,
  ])

  // Fetch stats for admin/staff
  useEffect(() => {
    if (isAdmin || user?.role === "staff") fetchStats()
  }, [
    selectedOrganisation,
    orgFilter,
    isGlobalAdmin,
    isAdmin,
    user,
    authLoading,
  ])

  // Fetch branches for edit dialog
  useEffect(() => {
    if (editDialogOpen && userToEdit) {
      const orgId =
        isGlobalAdmin && orgFilter ? orgFilter : selectedOrganisation
      if (orgId) {
        api
          .get<Branch[]>(`/organisations/${orgId}/branches`, {
            throwOnError: false,
          })
          .then((res) => {
            if (res) setEditBranches(res)
          })
          .catch(() => toast.error("Failed to load branches"))
      }
    }
  }, [
    editDialogOpen,
    userToEdit,
    selectedOrganisation,
    orgFilter,
    isGlobalAdmin,
  ])

  const handleEditClick = (userItem: User) => {
    setUserToEdit(userItem)
    editReset({
      name: userItem.name,
      phoneNumber: userItem.phoneNumber || "",
      role: userItem.role,
    })
    setEditDialogOpen(true)
  }

  const onEditSubmit = async (data: UserEditFormData) => {
    if (!userToEdit) return
    const prev = [...users]
    setUsers((u) =>
      u.map((x) =>
        x.id === userToEdit.id
          ? {
              ...x,
              role: data.role || x.role,
              branchId: editForm.getValues("branchId") || x.branchId,
            }
          : x
      )
    )
    try {
      await api.patch(`/users/${userToEdit.id}`, {
        role: data.role,
        branchId: data.branchId === "none" ? null : data.branchId,
      })
      toast.success("User updated successfully")
      setEditDialogOpen(false)
      setUserToEdit(null)
    } catch (err) {
      setUsers(prev)
      toast.error("Failed to update user")
    }
  }

  const optimisticToggleActive = async (userId: string, isActive: boolean) => {
    const prev = [...users]
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, isActive } : x)))
    try {
      await api.patch(`/users/${userId}`, { isActive })
      toast.success(isActive ? "User activated" : "User deactivated")
    } catch (err) {
      setUsers(prev)
      toast.error("Failed to update user")
    }
  }

  const handleDeleteClick = (userItem: User) => {
    setUserToDelete(userItem)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    const prev = [...users]
    setUsers((u) => u.filter((x) => x.id !== userToDelete.id))
    setDeleting(true)
    try {
      await api.delete(`/users/${userToDelete.id}`)
      toast.success("User deleted")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err) {
      setUsers(prev)
      toast.error("Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {row.original.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MailIcon className="h-3.5 w-3.5" />
            <span>{row.original.email}</span>
          </div>
          {row.original.phoneNumber && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <PhoneIcon className="h-3.5 w-3.5" />
              <span>{row.original.phoneNumber}</span>
            </div>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2Icon className="h-3.5 w-3.5 shrink-0" />
            <span>
              {u.branchId && branchMap.has(u.branchId)
                ? `${orgMap.get(u.organisationId) || "Org"} / ${branchMap.get(u.branchId)}`
                : orgMap.get(u.organisationId) || "-"}
            </span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const u = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/users/${u.id}`)}>
                <EditIcon className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              {isAdmin && u.id !== user?.id && (
                <DropdownMenuItem onClick={() => handleEditClick(u)}>
                  <ShieldIcon className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              )}
              {u.isActive ? (
                <DropdownMenuItem
                  onClick={() => optimisticToggleActive(u.id, false)}
                >
                  <UserMinusIcon className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => optimisticToggleActive(u.id, true)}
                >
                  <UserCheckIcon className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {isAdmin && u.id !== user?.id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(u)}
                    className="text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]

  return (
    <AnimatedPage className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="mt-1 text-muted-foreground">
              Manage users and their access
            </p>
          </div>
          {isMultiOrg && (
            <Select
              value={orgFilter}
              onValueChange={(val) => {
                setOrgFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select organisation" />
              </SelectTrigger>
              <SelectContent>
                {organisations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {isAdmin && (
          <p className="text-sm text-muted-foreground">
            Invite users from the{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={() => router.push("/invitations")}
            >
              Invitations page
            </Button>
          </p>
        )}
        {!isAdmin && (
          <p className="text-sm text-muted-foreground">
            Contact your admin to invite new users
          </p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <StatsCardGrid>
          <StatsCard
            title="Total Users"
            value={stats.total}
            icon={<UsersIcon className="h-5 w-5" />}
            color="blue"
            variant="inline"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={<UserCheckIcon className="h-5 w-5" />}
            color="green"
            variant="inline"
          />
          <StatsCard
            title="Customers"
            value={stats.customers}
            icon={<UserPlusIcon className="h-5 w-5" />}
            color="orange"
            variant="inline"
          />
          <StatsCard
            title="Staff"
            value={stats.staff}
            icon={<ShieldIcon className="h-5 w-5" />}
            color="purple"
            variant="inline"
          />
        </StatsCardGrid>
      )}

      {/* Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          {branches.length > 0 && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ExportButton
            sections={[
              {
                title: "Users",
                data: users,
                columns: [
                  { key: "name", header: "Name" },
                  { key: "email", header: "Email" },
                  { key: "phoneNumber", header: "Phone" },
                  { key: "role", header: "Role" },
                  { key: "isActive", header: "Status" },
                  { key: "createdAt", header: "Joined" },
                ],
              },
            ]}
            filename="users"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        getRowId={(row) => row.id}
        emptyState={<EmptyState entity="users" />}
        renderMobileCard={(user) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xs font-medium text-primary">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <span className="font-medium">{user.name}</span>
              </div>
              <RoleBadge role={user.role} />
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <StatusBadge isActive={user.isActive} />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
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
        pageCount={totalPages || 1}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        pageSizeOptions={[10, 20, 50, 100]}
        customFooter={
          <BulkActionFooter
            selectedCount={selectedIds.length}
            actions={[
              {
                label: "Activate",
                variant: "outline",
                onClick: () => {
                  selectedIds.forEach((id) => optimisticToggleActive(id, true))
                  setSelectedIds([])
                },
              },
              {
                label: "Deactivate",
                variant: "outline",
                onClick: () => {
                  selectedIds.forEach((id) => optimisticToggleActive(id, false))
                  setSelectedIds([])
                },
              },
            ]}
          />
        }
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and branch for {userToEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editHandleSubmit(onEditSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Controller
                  name="role"
                  control={editControl}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isGlobalAdmin && (
                          <>
                            <SelectItem value="admin">
                              Admin (Branch Admin)
                            </SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </>
                        )}
                        {!isGlobalAdmin && (
                          <SelectItem value="staff">Staff</SelectItem>
                        )}
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {editErrors.role && (
                  <p className="text-sm text-red-500">
                    {editErrors.role.message}
                  </p>
                )}
              </div>
              {editBranches.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-branch">Branch</Label>
                  <Controller
                    name="branchId"
                    control={editControl}
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="edit-branch">
                          <SelectValue placeholder="Select branch (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No branch</SelectItem>
                          {editBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editErrors.branchId && (
                    <p className="text-sm text-red-500">
                      {editErrors.branchId.message}
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editForm.formState.isSubmitting}
                className="gap-2"
              >
                {editForm.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
