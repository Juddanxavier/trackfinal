"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
import { getDialCode, prependCountryCode } from "@/lib/phone"
import { branchSchema, type BranchFormData } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const defaultForm = (overrides?: Partial<BranchFormData>): BranchFormData => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  ...overrides,
})

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  organisationId: string
  orgCountryCode?: string
  initial?: BranchFormData | null
  branchId?: string
  initialIsActive?: boolean
}

export function BranchFormDialog({
  open,
  onOpenChange,
  onSaved,
  organisationId,
  orgCountryCode,
  initial,
  branchId,
  initialIsActive,
}: BranchFormDialogProps) {
  const isEdit = !!branchId

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema as any),
  })
  const [branchActive, setBranchActive] = useState(true)

  useEffect(() => {
    if (open) {
      reset(initial ? defaultForm(initial) : defaultForm())
      setBranchActive(initialIsActive ?? true)
    }
  }, [open, initial, initialIsActive, reset])
  const cc = orgCountryCode || "LK"

  const onSubmit = async (data: BranchFormData) => {
    try {
      const payload = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
      }
      if (isEdit) {
        await api.patch(
          `/organisations/${organisationId}/branches/${branchId}`,
          { ...payload, isActive: branchActive }
        )
        toast.success("Branch updated")
      } else {
        await api.post(`/organisations/${organisationId}/branches`, payload)
        toast.success("Branch created")
      }
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error(
        isEdit ? "Failed to update branch" : "Failed to create branch"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onOpenChange(false)
          reset()
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Add Branch"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update branch details" : "Create a new branch"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Branch Name *</Label>
              <Input
                {...register("name")}
                placeholder="e.g., Colombo Central"
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input {...register("email")} placeholder="branch@example.com" />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                {...register("phone")}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v) setValue("phone", prependCountryCode(v, cc))
                }}
                placeholder={getDialCode(cc) + " 9000000000"}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input {...register("address")} placeholder="123 Main St" />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input {...register("city")} placeholder="Colombo" />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input {...register("state")} />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Postal Code</Label>
                <Input {...register("postalCode")} />
                {errors.postalCode && (
                  <p className="text-sm text-red-500">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>
            {isEdit && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="branch-active"
                  checked={branchActive}
                  onChange={(e) => setBranchActive(e.target.checked)}
                  className="size-4 rounded border-gray-300"
                />
                <Label htmlFor="branch-active" className="text-sm font-normal">
                  Active
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onOpenChange(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Branch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
