"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { UserStatsCards } from "@/components/user-stats-cards"
import { SearchTabs } from "@/components/search-tabs"
import { api } from "@/lib/api"
import { MoreHorizontalIcon, UserMinusIcon, TrashIcon, EditIcon, PlusIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
  SortableTableHead,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/ui/pagination"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { ExportButton } from "@/components/export-button"
import { AnimatedPage } from "@/components/animated-page"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  organisationId: string
  createdAt: string
  [key: string]: unknown
}

interface Stats {
  total: number
  active: number
  customers: number
  staff: number
}

export default function UsersPage() {
  const { user, selectedOrganisation, isLoading: authLoading, organisations } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortColumn, setSortColumn] = useState("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"staff" | "customer">("customer")
  const [inviteOrganisationId, setInviteOrganisationId] = useState(selectedOrganisation || "")
  const [inviting, setInviting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canInvite = user?.role === "admin" || user?.role === "staff"
  const canManageUsers = user?.role === "admin"
  const isMultiOrg = user?.role === "admin" && organisations.length > 1

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    try {
      await api.post("/auth/invitations", {
        email: inviteEmail,
        role: inviteRole,
        organisationId: isMultiOrg ? inviteOrganisationId : selectedOrganisation,
      })
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("customer")
    } catch (err) {
      console.error("Failed to invite user:", err)
    } finally {
      setInviting(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: false })
      fetchUsers()
    } catch (err) {
      console.error("Failed to deactivate user:", err)
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: true })
      fetchUsers()
    } catch (err) {
      console.error("Failed to activate user:", err)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/users/${userToDelete.id}`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (err) {
      console.error("Failed to delete user:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  const fetchUsers = async () => {
    if (authLoading) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", limit.toString())
      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (selectedOrganisation) params.set("organisationId", selectedOrganisation)
      if (user?.role === "admin") params.set("all", "true")
      if (sortColumn) {
        params.set("sortBy", sortColumn)
        params.set("sortOrder", sortDirection)
      }

      const res = await api.get<{ data: User[]; total: number; page: number; limit: number; totalPages: number }>(
        `/users?${params}`, { throwOnError: false }
      )
      if (res) {
        setUsers(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchUsers()
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [page, limit, roleFilter, selectedOrganisation, user, sortColumn, sortDirection, authLoading])

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading) return
      try {
        const params = new URLSearchParams()
        if (selectedOrganisation) {
          params.set("organisationId", selectedOrganisation)
        }
        const queryString = params.toString() ? `?${params.toString()}` : ""
        const res = await api.get<Stats>(`/users/stats${queryString}`, { throwOnError: false })
        if (res) {
          setStats(res)
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      }
    }
    if (user?.role === "admin") {
      fetchStats()
    }
  }, [selectedOrganisation, user, authLoading])

  const isFirstPage = page === 1
  const isLastPage = page === totalPages

return (
    <AnimatedPage className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all users in your organization</p>
        </div>
        {canInvite && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organisation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                {user?.role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as "staff" | "customer")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isMultiOrg && (
                  <div className="space-y-2">
                    <Label htmlFor="organisation">Organisation</Label>
                    <Select
                      value={inviteOrganisationId}
                      onValueChange={setInviteOrganisationId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {organisations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {stats && user?.role === "admin" && <UserStatsCards {...stats} />}

      <SearchTabs
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."
        tabsValue={roleFilter}
        onTabsChange={setRoleFilter}
        tabs={[
          { value: "all", label: "All" },
          { value: "admin", label: "Admin" },
          { value: "staff", label: "Staff" },
          { value: "customer", label: "Customer" },
        ]}
      />

      <div className="flex justify-end mb-4">
        <ExportButton
          data={users}
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status" },
            { key: "createdAt", header: "Created" },
          ]}
          filename="users"
        />
      </div>

      <div className="border rounded-lg bg-card mt-6 mx-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>name</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>email</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>role</SortableTableHead>
              <TableHead>Status</TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>created</SortableTableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                <Empty>
                  <EmptyDescription>No users found</EmptyDescription>
                </Empty>
              </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/users/${u.id}`)}>
                          <EditIcon className="mr-2 h-4 w-4" />
                          View & Edit
                        </DropdownMenuItem>
                        {canManageUsers && (
                          <>
                            <DropdownMenuSeparator />
                            {u.isActive ? (
                              <DropdownMenuItem onClick={() => handleDeactivate(u.id)}>
                                <UserMinusIcon className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(u.id)}>
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setUserToDelete(u)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
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
          <TableFooter>
            <tr>
              <td colSpan={7} className="px-4 py-3 text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
              </td>
            </tr>
          </TableFooter>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={limit}
        onPageChange={setPage}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}