"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const changeCarrierSchema = z.object({
  newCarrierCode: z.string().min(1, "Please select a new carrier"),
})
type ChangeCarrierFormData = z.infer<typeof changeCarrierSchema>

interface Shipment {
  id: string
  trackingNumber: string
  carrierCode: string
  carrierName?: string
}
interface Carrier {
  key: string
  name_en: string
}

interface ShipmentActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment | null
  type: "stoptrack" | "retrack" | "changecarrier" | null
  carriers: Carrier[]
}

function getActionLabel(type: string | null): string {
  switch (type) {
    case "stoptrack":
      return "stop"
    case "retrack":
      return "re-track"
    case "changecarrier":
      return "change carrier"
    default:
      return "perform action"
  }
}

function postTrackingAction(action: string, payload: any) {
  return api.post(`/tracking/${action}`, payload, { throwOnError: false })
}

export function ShipmentActionDialog({
  open,
  onOpenChange,
  shipment,
  type,
  carriers,
}: ShipmentActionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [carrierAttempts, setCarrierAttempts] = useState<{
    attempts: number
    attempts_left: number
  } | null>(null)

  const isChangeCarrier = type === "changecarrier"

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeCarrierFormData>({
    resolver: zodResolver(changeCarrierSchema),
    defaultValues: { newCarrierCode: "" },
  })

  useEffect(() => {
    if (open) {
      reset()
      setCarrierAttempts(null)
    }
  }, [open, reset])

  const fetchCarrierAttempts = async (trackingNumber: string) => {
    try {
      const res = (await api.get(`/tracking/changecarrier/${trackingNumber}`, {
        throwOnError: false,
      })) as any
      if (res && res.attempts_left !== undefined) setCarrierAttempts(res)
    } catch (err) {
      console.error("Failed to fetch carrier attempts:", err)
    }
  }

  const handleStopTrack = async (s: Shipment) => {
    const res: any = await postTrackingAction("stoptrack", [
      { number: s.trackingNumber, carrier: parseInt(s.carrierCode) || 0 },
    ])
    if (res?.accepted?.length > 0)
      toast.success(`Tracking stopped for ${s.trackingNumber}`)
    else toast.error(res?.rejected?.[0]?.error || "Failed to stop tracking")
  }

  const handleRetrack = async (s: Shipment) => {
    const res: any = await postTrackingAction("retrack", [
      { number: s.trackingNumber, carrier: parseInt(s.carrierCode) || 0 },
    ])
    if (res?.accepted?.length > 0)
      toast.success(`Re-tracking ${s.trackingNumber}`)
    else toast.error(res?.rejected?.[0]?.error || "Failed to re-track")
  }

  const handleChangeCarrier = async (s: Shipment, newCarrierCode: string) => {
    const res: any = await postTrackingAction("changecarrier", [
      {
        number: s.trackingNumber,
        carrier_old: parseInt(s.carrierCode) || 0,
        carrier_new: parseInt(newCarrierCode),
      },
    ])
    if (res?.accepted?.length > 0)
      toast.success(`Carrier changed for ${s.trackingNumber}`)
    else toast.error(res?.rejected?.[0]?.error || "Failed to change carrier")
  }

  const onSubmit = async (data: ChangeCarrierFormData) => {
    if (!shipment) return
    setLoading(true)
    try {
      if (type === "stoptrack") await handleStopTrack(shipment)
      else if (type === "retrack") await handleRetrack(shipment)
      else if (type === "changecarrier")
        await handleChangeCarrier(shipment, data.newCarrierCode)
    } catch {
      toast.error(`Failed to ${getActionLabel(type)}`)
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    if (type === "changecarrier") {
      handleSubmit(onSubmit)()
    } else {
      onSubmit({ newCarrierCode: "" })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          reset()
          setCarrierAttempts(null)
          onOpenChange(false)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "stoptrack" && "Stop Tracking"}
            {type === "retrack" && "Re-track Shipment"}
            {type === "changecarrier" && "Change Carrier"}
          </DialogTitle>
          <DialogDescription>
            {type === "stoptrack" &&
              `Stop tracking updates for ${shipment?.trackingNumber} on 17TRACK`}
            {type === "retrack" &&
              `Restart tracking for ${shipment?.trackingNumber}`}
            {type === "changecarrier" &&
              `Change carrier for ${shipment?.trackingNumber}`}
          </DialogDescription>
        </DialogHeader>
        {isChangeCarrier && (
          <div className="space-y-4">
            {carrierAttempts && (
              <div className="text-sm text-muted-foreground">
                Carrier changes remaining:{" "}
                <span className="font-medium">
                  {carrierAttempts.attempts_left}/5
                </span>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Current Carrier</Label>
              <Input
                value={shipment?.carrierName || shipment?.carrierCode || ""}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label>New Carrier</Label>
              <Controller
                name="newCarrierCode"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new carrier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers
                        .filter((c) => c.key !== shipment?.carrierCode)
                        .map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.name_en}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.newCarrierCode && (
                <p className="text-sm text-red-500">
                  {errors.newCarrierCode.message}
                </p>
              )}
            </div>
          </div>
        )}
        {type === "stoptrack" && (
          <p className="text-sm text-muted-foreground">
            This will stop tracking updates from 17TRACK. You can re-track
            later.
          </p>
        )}
        {type === "retrack" && (
          <p className="text-sm text-muted-foreground">
            This will restart tracking. Each tracking number can only be
            re-tracked once.
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setCarrierAttempts(null)
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
