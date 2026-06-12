"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
import { isAdminRole } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getDialCode } from "@/lib/phone"
import {
  createShipmentSchema,
  type CreateShipmentFormData,
} from "@/lib/validation"
import { z } from "zod"

const emailSchema = z.string().email().max(255).optional()
const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]+$/)
  .max(20)
  .optional()

interface Carrier {
  key: string
  name_en: string
}
interface Branch {
  id: string
  name: string
}
interface Org {
  id: string
  name: string
}

interface CreateShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  selectedOrganisation: string | null
  carriers: Carrier[]
  user: {
    id: string
    name?: string
    email?: string
    phoneNumber?: string
    role?: string
  } | null
  orgCountry: string
  branches: Branch[]
  organisations: Org[]
}

function formatPhone(phone: string, countryCode: string): string {
  let formatted = phone.replace(/\s/g, "")
  if (!formatted.startsWith("+"))
    formatted = getDialCode(countryCode) + formatted
  return formatted
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  onCreated,
  selectedOrganisation,
  carriers,
  user,
  orgCountry,
  branches: parentBranches,
  organisations,
}: CreateShipmentDialogProps) {
  const isSuperAdmin = user?.role === "superadmin"
  const [dialogOrg, setDialogOrg] = useState(selectedOrganisation)
  const [dialogBranches, setDialogBranches] = useState<Branch[]>(parentBranches)
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    if (open) {
      setDialogOrg(selectedOrganisation)
      setDialogBranches(parentBranches)
    }
  }, [open, selectedOrganisation, parentBranches])

  useEffect(() => {
    if (dialogOrg && dialogOrg !== selectedOrganisation) {
      setLoadingBranches(true)
      api
        .get<Branch[]>(`/organisations/${dialogOrg}/branches`, {
          throwOnError: false,
        })
        .then((res) => {
          if (Array.isArray(res)) setDialogBranches(res)
        })
        .catch(() => {})
        .finally(() => setLoadingBranches(false))
    } else {
      setDialogBranches(parentBranches)
    }
  }, [dialogOrg, selectedOrganisation, parentBranches])

  const [createStep, setCreateStep] = useState(1)
  const [detecting, setDetecting] = useState(false)
  const [detectionFailed, setDetectionFailed] = useState(false)
  const [carrierOpen, setCarrierOpen] = useState(false)
  const [carrierSearch, setCarrierSearch] = useState("")
  const carrierRef = React.useRef<HTMLDivElement>(null)
  const [assignToSelf, setAssignToSelf] = useState(false)

  const createForm = useForm<CreateShipmentFormData>({
    resolver: zodResolver(createShipmentSchema as any),
    defaultValues: {
      trackingNumber: "",
      carrierCode: "",
      recipientName: "",
      recipientEmail: "",
      recipientPhone: "",
      userId: "",
      branchId: "",
      billAmount: "",
    },
  })
  const {
    register: csRegister,
    handleSubmit: csHandleSubmit,
    watch: csWatch,
    setValue: csSetValue,
    reset: csReset,
    trigger: csTrigger,
    formState: { errors: csErrors, isSubmitting: csIsSubmitting },
  } = createForm

  const stepFields: Record<number, (keyof CreateShipmentFormData)[]> = {
    1: ["trackingNumber", "carrierCode"],
    2: ["recipientName", "recipientPhone", "recipientEmail"],
    3: ["userId", "branchId", "billAmount"],
  }

  const handleNext = async (step: number) => {
    const fields = stepFields[step]
    const valid = await csTrigger(fields)
    if (valid) setCreateStep(step + 1)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        carrierRef.current &&
        !carrierRef.current.contains(event.target as Node)
      ) {
        setCarrierOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) {
      csReset()
      setCreateStep(1)
      setAssignToSelf(false)
      setCarrierSearch("")
      setDetectionFailed(false)
    }
  }, [open, csReset])

  const handleAssignToSelfChange = (checked: boolean) => {
    setAssignToSelf(checked)
    if (checked) {
      csSetValue("userId", user?.id || "")
      csSetValue("recipientEmail", user?.email || "")
      csSetValue("recipientPhone", user?.phoneNumber || "")
      csSetValue("recipientName", user?.name || "")
    } else {
      csSetValue("userId", "")
      csSetValue("recipientEmail", "")
      csSetValue("recipientPhone", "")
      csSetValue("recipientName", "")
    }
  }

  const handleCarrierSearch = (search: string) => {
    const query = search.toLowerCase()
    const filtered = carriers.filter((c) =>
      c.name_en.toLowerCase().includes(query)
    )
    if (filtered.length === 1) {
      csSetValue("carrierCode", filtered[0].key)
    } else if (filtered.length === 0) {
      csSetValue("carrierCode", "")
    }
  }

  const detectCarrier = async (trackingNumber: string) => {
    if (!trackingNumber) return
    setDetecting(true)
    setDetectionFailed(false)
    try {
      const res = (await api.get(
        `/carriers/detect?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        { throwOnError: false }
      )) as any
      if (res?.detected && res?.carrierCode) {
        csSetValue("carrierCode", res.carrierCode || "")
        const match = carriers.find((c) => c.key === res.carrierCode)
        if (match) setCarrierSearch(match.name_en)
        setDetectionFailed(false)
      } else {
        setDetectionFailed(true)
      }
    } catch (err) {
      console.error("Failed to detect carrier:", err)
      setDetectionFailed(true)
    } finally {
      setDetecting(false)
    }
  }

  const onCreateSubmit = async (data: CreateShipmentFormData) => {
    try {
      const phone = formatPhone(data.recipientPhone, orgCountry)
      const payload = {
        trackingNumber: data.trackingNumber,
        carrierCode: data.carrierCode || "unknown",
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail || undefined,
        recipientPhone: phone,
        userId: data.userId || undefined,
        organisationId: dialogOrg,
        branchId: data.branchId || undefined,
        billAmount: data.billAmount ? parseFloat(data.billAmount) : undefined,
      }
      const res: any = await api.post("/shipments", payload, {
        throwOnError: false,
        timeout: 30000,
      })
      if (res?.error) {
        toast.error(res.message || "Failed to create shipment")
        return
      }
      toast.success("Shipment created")
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create shipment")
    }
  }

  const lookupUser = async (email?: string, phone?: string) => {
    if (!email && !phone) return
    try {
      if (email) emailSchema.parse(email)
      if (phone) phoneSchema.parse(phone)
    } catch {
      toast.error("Invalid input format")
      return
    }

    try {
      const params = new URLSearchParams()
      if (email) params.set("email", email)
      if (phone) params.set("phone", phone)
      const res = await api.get<{
        id: string
        name?: string
        email?: string
        phoneNumber?: string
      }>(`/users/lookup?${params}`, { throwOnError: false })
      if (res?.id) {
        csSetValue("userId", res.id)
        if (res.name) csSetValue("recipientName", res.name)
        if (res.email) csSetValue("recipientEmail", res.email)
        if (res.phoneNumber) csSetValue("recipientPhone", res.phoneNumber)
        toast.success("User found! Notifications will be sent to this user.")
      } else {
        toast.info(
          "No user found with this email/phone. Notifications will be sent to recipient contact instead."
        )
      }
    } catch (err) {
      console.error("Failed to lookup user:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Shipment</DialogTitle>
          <DialogDescription>
            {createStep === 1 && "Enter tracking number and select carrier."}
            {createStep === 2 && "Enter recipient details."}
            {createStep === 3 && "Assign ownership and billing."}
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 flex gap-1">
          <div
            className={`h-1 flex-1 rounded-full ${createStep >= 1 ? "bg-primary" : "bg-muted"}`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${createStep >= 2 ? "bg-primary" : "bg-muted"}`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${createStep >= 3 ? "bg-primary" : "bg-muted"}`}
          />
        </div>
        <form onSubmit={csHandleSubmit(onCreateSubmit)}>
          <div className="grid gap-4 pb-4">
            {createStep === 1 && (
              <>
                {isSuperAdmin && organisations.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Organisation</Label>
                    <Select
                      value={dialogOrg || ""}
                      onValueChange={(val) => setDialogOrg(val)}
                    >
                      <SelectTrigger>
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
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trackingNumber"
                      placeholder="Enter tracking number"
                      autoFocus
                      {...csRegister("trackingNumber")}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => detectCarrier(csWatch("trackingNumber"))}
                      disabled={!csWatch("trackingNumber") || detecting}
                    >
                      {detecting ? "..." : "Detect"}
                    </Button>
                  </div>
                  {csErrors.trackingNumber && (
                    <p className="text-sm text-red-500">
                      {csErrors.trackingNumber.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <div className="relative" ref={carrierRef}>
                      <Input
                        id="carrier"
                        placeholder="Search carrier..."
                        value={carrierSearch}
                        onChange={(e) => {
                          setDetectionFailed(false)
                          setCarrierSearch(e.target.value)
                          handleCarrierSearch(e.target.value)
                        }}
                        onFocus={() => {
                          setDetectionFailed(false)
                          setCarrierOpen(true)
                        }}
                      />
                    {carrierOpen && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg">
                        {carriers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No carriers
                          </div>
                        ) : (
                          carriers
                            .filter((c) =>
                              c.name_en
                                .toLowerCase()
                                .includes(carrierSearch.toLowerCase()),
                            )
                            .map((carrier) => (
                              <div
                                key={carrier.key}
                                className="cursor-pointer px-3 py-2 hover:bg-accent"
                                onClick={() => {
                                  csSetValue("carrierCode", carrier.key)
                                  setCarrierSearch(carrier.name_en)
                                  setCarrierOpen(false)
                                }}
                              >
                                {carrier.name_en}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                  {detectionFailed && (
                    <p className="text-sm text-amber-600">
                      Carrier not detected. Please select manually.
                    </p>
                  )}
                </div>
              </>
            )}
            {createStep === 2 && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="assignToSelf"
                    checked={assignToSelf}
                    onCheckedChange={(checked) =>
                      handleAssignToSelfChange(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="assignToSelf"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Assign to me (self)
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientEmail">Email (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipientEmail"
                      placeholder="recipient@example.com"
                      type="email"
                      value={csWatch("recipientEmail")}
                      onChange={(e) => {
                        csSetValue("recipientEmail", e.target.value, {
                          shouldValidate: true,
                        })
                        csSetValue("userId", "")
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => lookupUser(csWatch("recipientEmail"))}
                      disabled={!csWatch("recipientEmail")}
                      type="button"
                    >
                      Lookup
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientPhone">Phone</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipientPhone"
                      placeholder={getDialCode(orgCountry) + " 9000000000"}
                      value={csWatch("recipientPhone")}
                      onChange={(e) => {
                        csSetValue("recipientPhone", e.target.value, {
                          shouldValidate: true,
                        })
                        csSetValue("userId", "")
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        lookupUser(undefined, csWatch("recipientPhone"))
                      }
                      disabled={!csWatch("recipientPhone")}
                      type="button"
                    >
                      Lookup
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Enter name"
                    {...csRegister("recipientName")}
                  />
                </div>
              </>
            )}
            {createStep === 3 && (
              <>
                {isAdminRole(user?.role) && dialogBranches.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Branch</Label>
                    <Select
                      value={csWatch("branchId")}
                      onValueChange={(val) =>
                        csSetValue("branchId", val, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBranches ? "Loading..." : "Select branch"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dialogBranches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Bill Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...csRegister("billAmount")}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {createStep === 1 && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => handleNext(1)}>
                  Next
                </Button>
              </>
            )}
            {createStep === 2 && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCreateStep(1)}
                >
                  Back
                </Button>
                <Button type="button" onClick={() => handleNext(2)}>
                  Next
                </Button>
              </>
            )}
            {createStep === 3 && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCreateStep(2)}
                >
                  Back
                </Button>
                <Button type="submit" disabled={csIsSubmitting}>
                  {csIsSubmitting ? "Creating..." : "Create Shipment"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
