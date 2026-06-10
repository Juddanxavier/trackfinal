"use client"

import { useState, useEffect, type ReactNode } from "react"
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
  onRowDoubleClick?: (row: TData) => void
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

  // Mobile card view: renders small-screen card layout
  renderMobileCard?: (row: TData) => ReactNode

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

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
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

interface TableStateProps {
  manualSorting: boolean
  externalSorting: SortingState | undefined
  onSortingChange: ((sorting: SortingState) => void) | undefined
  manualPagination: boolean
  externalPage: number | undefined
  externalPageSize: number | undefined
  externalPageCount: number | undefined
  externalTotal: number | undefined
  onPageChange: ((page: number) => void) | undefined
  onPageSizeChange: ((pageSize: number) => void) | undefined
  clientPageSize: number
  data: unknown[]
}

interface TableState {
  sorting: SortingState
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void
  pagination: { pageIndex: number; pageSize: number }
  setPagination: (updater: any) => void
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
}

function useTableState(props: TableStateProps): TableState {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: props.clientPageSize,
  })

  const sorting = props.manualSorting
    ? (props.externalSorting ?? [])
    : internalSorting
  const setSorting = props.manualSorting
    ? (updater: SortingState | ((old: SortingState) => SortingState)) => {
        const next = typeof updater === "function" ? updater(sorting) : updater
        props.onSortingChange?.(next)
      }
    : setInternalSorting

  const pagination = props.manualPagination
    ? {
        pageIndex: (props.externalPage ?? 1) - 1,
        pageSize: props.externalPageSize ?? 10,
      }
    : internalPagination

  const setPagination = props.manualPagination
    ? (updater: any) => {
        const next =
          typeof updater === "function" ? updater(pagination) : updater
        props.onPageChange?.(next.pageIndex + 1)
        if (next.pageSize !== pagination.pageSize) {
          props.onPageSizeChange?.(next.pageSize)
        }
      }
    : setInternalPagination

  return {
    sorting,
    setSorting,
    pagination,
    setPagination,
    currentPage: props.manualPagination
      ? (props.externalPage ?? 1)
      : internalPagination.pageIndex + 1,
    pageSize: props.manualPagination
      ? (props.externalPageSize ?? 10)
      : internalPagination.pageSize,
    total: props.externalTotal ?? props.data.length,
    totalPages:
      props.externalPageCount ??
      Math.max(
        1,
        Math.ceil(
          (props.externalTotal ?? props.data.length) /
            (props.manualPagination
              ? (props.externalPageSize ?? 10)
              : internalPagination.pageSize)
        )
      ),
  }
}

interface DataTableHeaderProps {
  headerGroups: ReturnType<ReturnType<typeof useReactTable>["getHeaderGroups"]>
}

function DataTableHeader({ headerGroups }: DataTableHeaderProps) {
  return (
    <TableHeader className="bg-muted/50">
      {headerGroups.map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort()
            return (
              <TableHead
                key={header.id}
                className={cn(
                  canSort && "cursor-pointer select-none hover:bg-muted/70"
                )}
                onClick={
                  canSort ? header.column.getToggleSortingHandler() : undefined
                }
              >
                <div className="flex items-center">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {canSort && (
                    <SortIcon direction={header.column.getIsSorted()} />
                  )}
                </div>
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}

interface DataTableBodyProps<TData> {
  loading: boolean
  columns: ColumnDef<TData>[]
  rows: ReturnType<
    ReturnType<typeof useReactTable<TData>>["getRowModel"]
  >["rows"]
  enableRowSelection: boolean
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  emptyState?: ReactNode
}

function DataTableBody<TData>({
  loading,
  columns,
  rows,
  enableRowSelection,
  onRowClick,
  onRowDoubleClick,
  emptyState,
}: DataTableBodyProps<TData>) {
  if (loading && rows.length === 0) {
    return (
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`skeleton-${i}`}>
            {columns.map((_, j) => (
              <TableCell key={`skeleton-cell-${i}-${j}`}>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="py-12 text-center text-muted-foreground"
          >
            {emptyState ?? (
              <div className="flex flex-col items-center gap-2">
                <p>No data found</p>
              </div>
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          data-state={
            enableRowSelection && row.getIsSelected() ? "selected" : undefined
          }
          className={cn(
            "border-t transition-colors",
            (onRowClick || onRowDoubleClick) &&
              "cursor-pointer hover:bg-muted/50"
          )}
          onClick={() => onRowClick?.(row.original)}
          onDoubleClick={() => onRowDoubleClick?.(row.original)}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
      {loading && (
        <TableRow>
          <TableCell colSpan={columns.length} className="py-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  pageSizeOptions: number[]
  manualPagination: boolean
  enableRowSelection: boolean
  selectedCount: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  columnsLength: number
  hasFooterGroups: boolean
  footerGroups: ReturnType<ReturnType<typeof useReactTable>["getFooterGroups"]>
  customFooter?: ReactNode
  showPagination: boolean
}

function PaginationContent({
  currentPage,
  totalPages,
  total,
  pageSize,
  pageSizeOptions,
  manualPagination,
  enableRowSelection,
  selectedCount,
  onPageChange,
  onPageSizeChange,
  showPagination,
}: Omit<DataTablePaginationProps, "columnsLength" | "hasFooterGroups" | "footerGroups" | "customFooter">) {
  if (!showPagination) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {enableRowSelection && selectedCount > 0
            ? `${selectedCount} of ${total} selected`
            : total === 0
              ? "No results"
              : `Page ${currentPage} of ${totalPages} · ${total} total`}
        </p>
        {pageSizeOptions.length > 1 && manualPagination && (
          <select
            className="rounded border bg-transparent px-1 py-0.5 text-sm text-muted-foreground"
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
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
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          Previous
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function DataTablePagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  pageSizeOptions,
  manualPagination,
  enableRowSelection,
  selectedCount,
  onPageChange,
  onPageSizeChange,
  columnsLength,
  hasFooterGroups,
  footerGroups,
  customFooter,
  showPagination,
}: DataTablePaginationProps) {
  if (!hasFooterGroups && !customFooter && !showPagination) return null

  return (
    <TableFooter>
      {hasFooterGroups &&
        footerGroups.map((footerGroup) => (
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
          <TableCell colSpan={columnsLength} className="px-4 py-3">
            {customFooter}
          </TableCell>
        </TableRow>
      )}
      {showPagination && (
        <TableRow>
          <TableCell colSpan={columnsLength} className="px-4 py-3">
            <PaginationContent
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              manualPagination={manualPagination}
              enableRowSelection={enableRowSelection}
              selectedCount={selectedCount}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showPagination={showPagination}
            />
          </TableCell>
        </TableRow>
      )}
    </TableFooter>
  )
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  onRowDoubleClick,
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
  renderMobileCard,
  footer,
  className,
}: DataTableProps<TData>) {
  const [internalSelection, setInternalSelection] = useState<string[]>([])

  const {
    sorting,
    setSorting,
    pagination,
    setPagination,
    currentPage,
    pageSize,
    total,
    totalPages,
  } = useTableState({
    manualSorting,
    externalSorting,
    onSortingChange,
    manualPagination,
    externalPage,
    externalPageSize,
    externalPageCount,
    externalTotal,
    onPageChange,
    onPageSizeChange,
    clientPageSize,
    data,
  })

  const effectiveSelectedIds = onSelectionChange
    ? selectedIds
    : internalSelection
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
            if (onSelectionChange) onSelectionChange(ids)
            else setInternalSelection(ids)
          },
          enableRowSelection: true,
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
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

  const loadingRows = table.getRowModel().rows

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="hidden sm:block">
        <Table>
          <DataTableHeader headerGroups={table.getHeaderGroups()} />
          <DataTableBody
            loading={!!loading}
            columns={columns}
            rows={loadingRows}
            enableRowSelection={enableRowSelection}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            emptyState={emptyState}
          />
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            manualPagination={manualPagination}
            enableRowSelection={enableRowSelection}
            selectedCount={effectiveSelectedIds.length}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            columnsLength={columns.length}
            hasFooterGroups={hasFooterGroups}
            footerGroups={table.getFooterGroups()}
            customFooter={customFooter}
            showPagination={data.length > 0}
          />
        </Table>
      </div>

      {renderMobileCard && (
        <div className="block sm:hidden">
          <div className="divide-y divide-border">
            {loading && loadingRows.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ))
              : loadingRows.map((row) => (
                  <div
                    key={row.id}
                    className={cn(
                      "p-4",
                      (onRowClick || onRowDoubleClick) &&
                        "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  >
                    {renderMobileCard(row.original)}
                  </div>
                ))}
            {!loading && loadingRows.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {emptyState ?? "No data found"}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border">
            <PaginationContent
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              manualPagination={manualPagination}
              enableRowSelection={enableRowSelection}
              selectedCount={effectiveSelectedIds.length}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showPagination={data.length > 0}
            />
          </div>
        </div>
      )}

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
