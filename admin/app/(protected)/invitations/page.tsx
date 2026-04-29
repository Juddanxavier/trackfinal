"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { SearchTabs } from "@/components/search-tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow,
  SortableTableHead,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription } from "@/components/ui/empty"
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
import { Checkbox } from "@/components/ui/checkbox"
import { SimplePagination } from "@/components/ui/pagination"
import { PlusIcon, TrashIcon, Loader2, MailIcon, UsersIcon, ClockIcon, AlertCircleIcon } from "lucide-react"

interface Invitation {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
  organisationId: string
  organisationName: string
}

export default function InvitationsPage() {
  const router = useRouter()
  const { user, organisations, selectedOrganisation } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "expired">("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [sortColumn, setSortColumn] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff")
  const [inviteOrganisationId, setInviteOrganisationId] = useState(selectedOrganisation || "")
  const [inviting, setInviting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user?.role === "staff") {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (user?.role === "staff") {
    return null
  }

  const isAdmin = user?.role === "admin"
  const isMultiOrg = isAdmin && organisations.length > 1
  const canInvite = isAdmin

  const fetchInvitations = async () => {
    try {
      const res = await api.get<Invitation[]>(`/auth/invitations`, { throwOnError: false })
      if (res && Array.isArray(res)) {
        setInvitations(res)
        setFilteredInvitations(res)
        setTotal(res.length)
        setPage(1)
      } else {
        setInvitations([])
        setFilteredInvitations([])
        setTotal(0)
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err)
      setInvitations([])
      setFilteredInvitations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  useEffect(() => {
    if (!invitations.length) return

    const now = new Date()
    let filtered = [...invitations]

    if (search) {
      filtered = filtered.filter(inv =>
        inv.email.toLowerCase().includes(search.toLowerCase()) ||
        inv.organisationName.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter === "pending") {
      filtered = filtered.filter(inv => new Date(inv.expiresAt) > now)
    } else if (statusFilter === "expired") {
      filtered = filtered.filter(inv => new Date(inv.expiresAt) <= now)
    }

    filtered.sort((a, b) => {
      let aVal = a[sortColumn as keyof Invitation]
      let bVal = b[sortColumn as keyof Invitation]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredInvitations(filtered)
  }, [invitations, search, statusFilter, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const paginatedInvitations = filteredInvitations.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredInvitations.length / limit)
  const isFirstPage = page === 1
  const isLastPage = page === totalPages

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    try {
      await api.post("/auth/invitations", {
        email: inviteEmail,
        role: inviteRole,
        organisationId: isMultiOrg ? inviteOrganisationId : selectedOrganisation,
      })
      setInviteEmail("")
      setInviteRole("staff")
      setInviteDialogOpen(false)
      fetchInvitations()
    } catch (err) {
      console.error("Failed to invite user:", err)
    } finally {
      setInviting(false)
    }
  }

  const handleDeleteClick = (inv: Invitation) => {
    setInvitationToDelete(inv)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!invitationToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/auth/invitations/${invitationToDelete.id}`)
      setDeleteDialogOpen(false)
      setInvitationToDelete(null)
      fetchInvitations()
    } catch (err) {
      console.error("Failed to delete invitation:", err)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) <= new Date()
    return isExpired ? (
      <Badge variant="destructive">Expired</Badge>
    ) : (
      <Badge variant="secondary">Pending</Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pending user invitations
          </p>
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
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as "admin" | "staff")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
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

      <SearchTabs
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or organisation..."
        tabsValue={statusFilter}
        onTabsChange={setStatusFilter as any}
        tabs={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "expired", label: "Expired" },
        ]}
      />

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>Email</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>Organisation</SortableTableHead>
              <TableHead>Status</TableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>Invited</SortableTableHead>
              <SortableTableHead onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection}>Expires</SortableTableHead>
              {isAdmin && <TableHead className="w-10">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : paginatedInvitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6}>
                  <Empty>
                    <MailIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <EmptyDescription>No invitations found</EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>{inv.organisationName}</TableCell>
                  <TableCell>{getStatusBadge(inv.expiresAt)}</TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(inv)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {filteredInvitations.length > 0 ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, filteredInvitations.length)} of ${filteredInvitations.length}` : 'No results'}
                  </span>
                  <SimplePagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the invitation for {invitationToDelete?.email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}