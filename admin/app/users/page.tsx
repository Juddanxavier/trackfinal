"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { UserStatsCards } from "@/components/user-stats-cards"
import { SearchTabs } from "@/components/search-tabs"
import { api } from "@/lib/api"
import {
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  organisationId: string
  createdAt: string
}

interface Stats {
  total: number
  active: number
  customers: number
  staff: number
}

export default function UsersPage() {
  const { user, selectedOrganisation } = useAuth()
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

  const canInvite = user?.role === "admin" || user?.role === "staff"

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  const fetchUsers = async () => {
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
  }, [page, limit, roleFilter, selectedOrganisation, user, sortColumn, sortDirection])

  useEffect(() => {
    const fetchStats = async () => {
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
  }, [selectedOrganisation, user])

  const isFirstPage = page === 1
  const isLastPage = page === totalPages

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all users in your organization</p>
        </div>
        {canInvite && (
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Invite User
          </Button>
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

      <div className="border rounded-lg bg-card">
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
            ) : users.length === 0 ? (
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
                        <DropdownMenuItem onClick={() => router.push(`/users/${u.id}`)}>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        {user?.role === "admin" && (
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
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
    </div>
  )
}