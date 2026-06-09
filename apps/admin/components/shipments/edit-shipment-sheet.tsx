"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { editShipmentSchema, type EditShipmentFormData } from "@/lib/validation"

interface Shipment {
  id: string
  trackingNumber: string
  recipientName?: string
  recipientEmail?: string
  recipientPhone?: string
  branchId?: string
  billAmount?: number
}

interface Branch {
  id: string
  name: string
}

interface EditShipmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment | null
  branches: Branch[]
  user: { role?: string } | null
  onUpdated: () => void
}

function toFormDefaults(shipment: Shipment | null): EditShipmentFormData {
  return {
    recipientName: shipment?.recipientName || "",
    recipientEmail: shipment?.recipientEmail || "",
    recipientPhone: shipment?.recipientPhone || "",
    branchId: shipment?.branchId || "",
    billAmount: shipment?.billAmount != null ? String(shipment.billAmount) : "",
  }
}

export function EditShipmentSheet({
  open,
  onOpenChange,
  shipment,
  branches,
  user,
  onUpdated,
}: EditShipmentSheetProps) {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditShipmentFormData>({
    resolver: zodResolver(editShipmentSchema),
  })

  const handleOpenChange = (open: boolean) => {
    if (open && shipment) {
      reset(toFormDefaults(shipment))
    }
    onOpenChange(open)
  }

  const onSubmit = async (data: EditShipmentFormData) => {
    if (!shipment) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail || undefined,
        recipientPhone: data.recipientPhone,
        branchId: data.branchId,
      }
      if (data.billAmount) payload.billAmount = parseFloat(data.billAmount)

      const res: any = await api.patch(`/shipments/${shipment.id}`, payload, {
        throwOnError: false,
      })
      if (res?.error) {
        toast.error(res.message || "Failed to update shipment")
        return
      }
      toast.success("Shipment updated")
      onOpenChange(false)
      onUpdated()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update shipment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="p-6 sm:max-w-md">
        <SheetHeader className="px-0">
          <SheetTitle>Edit Shipment</SheetTitle>
          <SheetDescription>
            Update recipient details for{" "}
            <strong>{shipment?.trackingNumber}</strong>
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input id="recipientName" {...register("recipientName")} />
              {errors.recipientName && (
                <p className="text-sm text-red-500">
                  {errors.recipientName.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                {...register("recipientEmail")}
              />
              {errors.recipientEmail && (
                <p className="text-sm text-red-500">
                  {errors.recipientEmail.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipientPhone">Phone *</Label>
              <Input id="recipientPhone" {...register("recipientPhone")} />
              {errors.recipientPhone && (
                <p className="text-sm text-red-500">
                  {errors.recipientPhone.message}
                </p>
              )}
            </div>
            {user?.role === "admin" && branches.length > 0 && (
              <div className="grid gap-2">
                <Label>Branch *</Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && (
                  <p className="text-sm text-red-500">
                    {errors.branchId.message}
                  </p>
                )}
              </div>
            )}
            {user?.role === "admin" && (
              <div className="grid gap-2">
                <Label htmlFor="billAmount">Bill Amount</Label>
                <Input
                  id="billAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("billAmount")}
                />
                {errors.billAmount && (
                  <p className="text-sm text-red-500">
                    {errors.billAmount.message}
                  </p>
                )}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
