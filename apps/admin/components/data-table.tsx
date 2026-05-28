"use client"

import { useState, useEffect } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string

  // Server-side sorting
  manualSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void

  // Server-side pagination
  manualPagination?: boolean
  pageCount?: number
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]

  // Client-side pagination (only when manualPagination is false)
  clientPageSize?: number

  // Custom footer rendered before pagination in TableFooter
  customFooter?: React.ReactNode

  // Selection
  enableRowSelection?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void

  // Footer
  footer?: React.ReactNode

  className?: string
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | "...")[] = [1]
  if (currentPage <= 3) {
    pages.push(2, 3, 4, "...")
  } else if (currentPage >= totalPages - 2) {
    pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1)
  } else {
    pages.push("...", currentPage, "...")
  }
  pages.push(totalPages)
  return pages
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) return null
  return (
    <span className="ml-1 text-xs text-muted-foreground">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  )
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  emptyState,
  onRowClick,
  getRowId,
  manualSorting = false,
  sorting: externalSorting,
  onSortingChange,
  manualPagination = false,
  pageCount: externalPageCount,
  page: externalPage,
  pageSize: externalPageSize,
  total: externalTotal,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
  clientPageSize = 10,
  enableRowSelection = false,
  selectedIds = [],
  onSelectionChange,
  customFooter,
  footer,
  className,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: clientPageSize,
  })
  const [internalSelection, setInternalSelection] = useState<string[]>([])

  const sorting = manualSorting ? (externalSorting ?? []) : internalSorting
  const setSorting = manualSorting
    ? (updater: SortingState | ((old: SortingState) => SortingState)) => {
        const next =
          typeof updater === "function" ? updater(sorting) : updater
        onSortingChange?.(next)
      }
    : setInternalSorting

  const pagination = manualPagination
    ? {
        pageIndex: (externalPage ?? 1) - 1,
        pageSize: externalPageSize ?? 10,
      }
    : internalPagination

  const setPagination = manualPagination
    ? (updater: any) => {
        const next =
          typeof updater === "function" ? updater(pagination) : updater
        onPageChange?.(next.pageIndex + 1)
        if (next.pageSize !== pagination.pageSize) {
          onPageSizeChange?.(next.pageSize)
        }
      }
    : setInternalPagination

  const currentPage = manualPagination
    ? externalPage ?? 1
    : internalPagination.pageIndex + 1
  const pageSize = manualPagination
    ? externalPageSize ?? 10
    : internalPagination.pageSize
  const total = externalTotal ?? data.length
  const totalPages =
    externalPageCount ?? Math.max(1, Math.ceil(total / pageSize))

  const effectiveSelectedIds = onSelectionChange ? selectedIds : internalSelection
  const rowSelectionState: RowSelectionState = {}
  if (enableRowSelection) {
    effectiveSelectedIds.forEach((id) => {
      rowSelectionState[id] = true
    })
  }

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      pagination,
      ...(enableRowSelection ? { rowSelection: rowSelectionState } : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    ...(enableRowSelection
      ? {
          onRowSelectionChange: (updater: any) => {
            const next =
              typeof updater === "function"
                ? updater(rowSelectionState)
                : updater
            const ids = Object.keys(next).filter((k) => next[k])
            if (onSelectionChange) {
              onSelectionChange(ids)
            } else {
              setInternalSelection(ids)
            }
          },
          enableRowSelection: true,
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel:
      manualPagination ? undefined : getPaginationRowModel(),
    manualSorting,
    manualPagination,
    pageCount: manualPagination ? totalPages : undefined,
  })

  useEffect(() => {
    if (manualPagination && externalPage !== undefined) {
      table.setPageIndex(externalPage - 1)
    }
  }, [externalPage])

  const hasFooterGroups = (columns as any[]).some((col) => col.footer != null)

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden",
        className
      )}
    >
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      canSort &&
                        "cursor-pointer select-none hover:bg-muted/70"
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {canSort && (
                        <SortIcon
                          direction={header.column.getIsSorted()}
                        />
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((_, j) => (
                  <TableCell key={`skeleton-cell-${i}-${j}`}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-12 text-muted-foreground"
              >
                {emptyState ?? (
                  <div className="flex flex-col items-center gap-2">
                    <p>No data found</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={
                  enableRowSelection && row.getIsSelected()
                    ? "selected"
                    : undefined
                }
                className={cn(
                  "border-t transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
          {loading && table.getRowModel().rows.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-3"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {(hasFooterGroups || customFooter || data.length > 0) && (
          <TableFooter>
            {hasFooterGroups &&
              table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <TableCell key={header.id}>
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {customFooter && (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4 py-3">
                  {customFooter}
                </TableCell>
              </TableRow>
            )}
            {(data.length > 0) && (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        {enableRowSelection &&
                        effectiveSelectedIds.length > 0
                          ? `${effectiveSelectedIds.length} of ${total} selected`
                          : total === 0
                            ? "No results"
                            : `Page ${currentPage} of ${totalPages} · ${total} total`}
                      </p>
                      {pageSizeOptions.length > 1 && manualPagination && (
                        <select
                          className="text-sm bg-transparent border rounded px-1 py-0.5 text-muted-foreground"
                          value={pageSize}
                          onChange={(e) => {
                            const newSize = Number(e.target.value)
                            onPageSizeChange?.(newSize)
                          }}
                        >
                          {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size} per page
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      {getPageNumbers(currentPage, totalPages).map(
                        (p, index) =>
                          p === "..." ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-1 text-muted-foreground text-sm"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={`page-${p}`}
                              variant={
                                currentPage === p ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => onPageChange?.(p)}
                              className="min-w-[2.25rem]"
                            >
                              {p}
                            </Button>
                          )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        )}
      </Table>
      {footer}
    </div>
  )
}

export function SelectAllCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(val) => onCheckedChange(val as boolean)}
    />
  )
}

export function RowCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(val) => onCheckedChange(val as boolean)}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export type { ColumnDef, SortingState }
