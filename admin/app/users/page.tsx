"use client"

import React from "react"
import { useAuth, AuthProvider } from "@/components/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserStatsCards } from "@/components/user-stats-cards"
import { api, ApiError } from "@/lib/api"
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ArrowUpDownIcon,
  Loader2,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UserRole = "admin" | "staff" | "customer"

interface User {
  id: string
  email: string
  name: string
  phoneNumber?: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  organisationId: string
}

interface PaginatedUsers {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface InviteForm {
  email: string
  name: string
  phoneNumber: string
  role: UserRole
}

function UsersTable() {
  const {
    user,
    isLoading,
    organisations,
    selectedOrganisation,
    setSelectedOrganisation,
  } = useAuth()
  const [users, setUsers] = React.useState<User[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [totalPages, setTotalPages] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState("desc")

  const [showAllStats, setShowAllStats] = React.useState(false)
  const [allStats, setAllStats] = React.useState({
    total: 0,
    active: 0,
    customers: 0,
    staff: 0,
  })
  const [organisationsMap, setOrganisationsMap] = React.useState<Record<string, string>>({})

  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteForm, setInviteForm] = React.useState<InviteForm>({
    email: "",
    name: "",
    phoneNumber: "",
    role: "customer",
  })
  const [inviting, setInviting] = React.useState(false)

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState({ name: "", email: "", phoneNumber: "" })
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  const canInvite = user?.role === "admin" || user?.role === "staff"

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })
      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (statusFilter !== "all") params.set("isActive", statusFilter)

      const orgId = showAllStats
        ? undefined
        : user?.role === "admin"
          ? selectedOrganisation
          : user?.organisationId
      if (orgId) params.set("organisationId", orgId)

      const result = await api.get<PaginatedUsers>(`/users?${params}`)
      setUsers(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setUsers([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    search,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
    selectedOrganisation,
    showAllStats,
    user,
  ])

  React.useEffect(() => {
    if (!isLoading && user) {
      if (!selectedOrganisation && user.role === "admin") {
        setShowAllStats(true)
      }
      fetchUsers()
    }
  }, [fetchUsers, isLoading, user, selectedOrganisation])

  React.useEffect(() => {
    if (user?.role === "admin") {
      api
        .get<{
          total: number
          active: number
          customers: number
          staff: number
        }>("/users/stats/all")
        .then((stats) => {
          setAllStats(stats)
        })
        .catch((err) => {
          console.error("Failed to fetch stats:", err)
          setAllStats({ total: 0, active: 0, customers: 0, staff: 0 })
        })
    }
  }, [user])

  React.useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleInvite = async () => {
    setInviting(true)
    try {
      await api.post("/users/invite", {
        email: inviteForm.email,
        name: inviteForm.name,
        phoneNumber: inviteForm.phoneNumber || undefined,
        role: inviteForm.role,
        organisationId: selectedOrganisation,
      })
      console.log("Invitation sent")
      setInviteOpen(false)
    } catch (err: any) {
      console.error(err.message || "Failed")
    } finally {
      setInviting(false)
    }
  }

const handleDelete = async (userId: string) => {
    setDeletingId(userId)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/users/${deletingId}`)
      setDeleteOpen(false)
      setDeletingId(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(column)}
        className="-ml-4 h-8"
      >
        {label}
        <ArrowUpDownIcon className="ml-2 size-3" />
      </Button>
    </TableHead>
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    window.location.href = "/login"
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          avatar: "",
          role: user.role,
        }}
        organisations={organisations}
        selectedOrganisation={selectedOrganisation || user.organisationId}
        onOrganisationChange={setSelectedOrganisation}
        onLogout={() => (window.location.href = "/login")}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col bg-background p-6">
          <div className="flex flex-col gap-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage users</p>
              </div>
              {canInvite && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 size-4" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite User</DialogTitle>
                      <DialogDescription>
                        Send invitation to join.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          value={inviteForm.name}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input
                          value={inviteForm.phoneNumber}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              phoneNumber: e.target.value,
                            })
                          }
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      {user?.role === "admin" && (
                        <div className="grid gap-2">
                          <Label>Role</Label>
                          <Select
                            value={inviteForm.role}
                            onValueChange={(v) =>
                              setInviteForm({
                                ...inviteForm,
                                role: v as UserRole,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleInvite}
                        disabled={
                          inviting || !inviteForm.email || !inviteForm.name
                        }
                      >
                        {inviting && (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Stats Cards */}
            <UserStatsCards
              total={showAllStats ? allStats.total : total}
              active={
                showAllStats
                  ? allStats.active
                  : users.filter((u) => u.isActive).length
              }
              customers={
                showAllStats
                  ? allStats.customers
                  : users.filter((u) => u.role === "customer").length
              }
              staff={
                showAllStats
                  ? allStats.staff
                  : users.filter(
                      (u) => u.role === "staff" || u.role === "admin"
                    ).length
              }
            />

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative w-full">
                  <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9"
                  />
                </div>
                {user?.role === "admin" && (
                  <div className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={showAllStats}
                      onCheckedChange={setShowAllStats}
                    />
                    <span>All Orgs</span>
                  </div>
                )}
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={limit.toString()}
                onValueChange={(v) => setLimit(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              {(roleFilter !== "all" || statusFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoleFilter("all")
                    setStatusFilter("all")
                    setSearch("")
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selectedRows.size === users.length && users.length > 0
                        }
                        onCheckedChange={(c) =>
                          c
                            ? setSelectedRows(new Set(users.map((u) => u.id)))
                            : setSelectedRows(new Set())
                        }
                      />
                    </TableHead>
                    <SortHeader column="name" label="Name" />
                    <SortHeader column="email" label="Email" />
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <SortHeader column="createdAt" label="Created" />
                    <TableHead className="w-10">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <Loader2 className="mx-auto size-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(u.id)}
                            onCheckedChange={(c) => {
                              const ns = new Set(selectedRows)
                              c ? ns.add(u.id) : ns.delete(u.id)
                              setSelectedRows(ns)
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phoneNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedUser(u); setViewOpen(true); }}>
                                <SearchIcon className="size-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {user?.role === "admin" && (
                                <>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(u); setEditForm({ name: u.name, email: u.email, phoneNumber: u.phoneNumber || "" }); setEditOpen(true); }}>
                                    <PencilIcon className="size-4 mr-2" /> Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(u.id)} className="text-red-600">
                                    <TrashIcon className="size-4 mr-2" /> Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {total === 0 ? 0 : (page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1 || totalPages === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="icon"
                      className="min-w-9"
                      onClick={() => setPage(pageNum)}
                      disabled={totalPages === 1}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages || totalPages === 1}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* View Sheet */}
            <Sheet open={viewOpen} onOpenChange={setViewOpen}>
              <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>User Details</SheetTitle>
                  <SheetDescription>
                    View user information and account status
                  </SheetDescription>
                </SheetHeader>
                {selectedUser && (
                  <div className="mt-6 flex flex-col gap-6 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          {selectedUser.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
<div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Email
                        </div>
                        <div className="truncate text-sm">
                          {selectedUser.email}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Phone
                        </div>
                        <div className="text-sm">
                          {selectedUser.phoneNumber || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Role
                        </div>
                        <div className="font-medium capitalize">
                          {selectedUser.role}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Status
                        </div>
                        <Badge
                          variant={
                            selectedUser.isActive ? "outline" : "destructive"
                          }
                          className={
                            selectedUser.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : ""
                          }
                        >
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Email Verified
                        </div>
                        <Badge
                          variant={
                            selectedUser.emailVerified ? "outline" : "secondary"
                          }
                        >
                          {selectedUser.emailVerified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">
                          Organisation
                        </div>
                        <div className="truncate text-sm">
                          {selectedUser.organisationId ? organisations.find((o) => o.id === selectedUser.organisationId)?.name || selectedUser.organisationId.slice(0, 8) : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">
                          Created
                        </span>
                        <span className="text-sm">
                          {new Date(
                            selectedUser.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">
                          Updated
                        </span>
                        <span className="text-sm">
                          {new Date(
                            selectedUser.updatedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          User ID
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {selectedUser.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {user?.role === "admin" && (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setEditForm({ name: selectedUser.name, email: selectedUser.email, phoneNumber: selectedUser.phoneNumber || "" }); setEditOpen(true); }}
                          >
                            <PencilIcon className="size-4 mr-2" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDelete(selectedUser.id)}
                          >
                            <TrashIcon className="size-4 mr-2" /> Delete
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setViewOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user information</DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input value={selectedUser.email} disabled />
                    </div>
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={async () => {
                    try {
                      await api.patch(`/users/${selectedUser?.id}`, { name: editForm.name, phoneNumber: editForm.phoneNumber || null })
                      fetchUsers()
                      setEditOpen(false)
                    } catch (err) {
                      console.error(err)
                    }
                  }}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete User</DialogTitle>
                  <DialogDescription>Are you sure you want to delete this user? This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function UsersPage() {
  return (
    <AuthProvider>
      <UsersTable />
    </AuthProvider>
  )
}
