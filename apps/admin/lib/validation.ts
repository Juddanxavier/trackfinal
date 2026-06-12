import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fieldErrors<T>(
  result: { success: true } | { success: false; error: any }
): Partial<Record<keyof T, string>> {
  if (result.success) return {} as Partial<Record<keyof T, string>>
  const errors: Record<string, string> = {}
  if (result.error?.issues) {
    for (const issue of result.error.issues) {
      const key = issue.path?.[0] as string
      if (key && !errors[key]) errors[key] = issue.message
    }
  }
  return errors as Partial<Record<keyof T, string>>
}

export const orgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .or(z.literal(""))
    .optional(),
  phone: z.string().max(20).or(z.literal("")).optional(),
  address: z.string().max(500).or(z.literal("")).optional(),
  city: z.string().max(100).or(z.literal("")).optional(),
  state: z.string().max(100).or(z.literal("")).optional(),
  postalCode: z.string().max(20).or(z.literal("")).optional(),
  countryCode: z.string().optional(),
  currency: z.string().optional(),
})

export type OrgFormData = z.infer<typeof orgSchema>

export const branchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .max(200, "Name is too long"),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .or(z.literal(""))
    .optional(),
  phone: z.string().max(20).or(z.literal("")).optional(),
  address: z.string().max(500).or(z.literal("")).optional(),
  city: z.string().max(100).or(z.literal("")).optional(),
  state: z.string().max(100).or(z.literal("")).optional(),
  postalCode: z.string().max(20).or(z.literal("")).optional(),
})

export type BranchFormData = z.infer<typeof branchSchema>

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  phoneNumber: z.string().max(20).or(z.literal("")).optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const userEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  phoneNumber: z.string().max(20).or(z.literal("")).optional(),
  role: z.string().min(1, "Role is required"),
  branchId: z.string().optional(),
})

export type UserEditFormData = z.infer<typeof userEditSchema>

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  message: z.string().min(1, "Message is required").max(5000),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export const quoteEmailSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject is too long"),
  message: z.string().max(5000).optional(),
})

export type QuoteEmailFormData = z.infer<typeof quoteEmailSchema>

export const settingsOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z.string().max(20).or(z.literal("")).optional().nullable(),
  address: z.string().max(500).or(z.literal("")).optional().nullable(),
  city: z.string().max(100).or(z.literal("")).optional().nullable(),
  state: z.string().max(100).or(z.literal("")).optional().nullable(),
  postalCode: z.string().max(20).or(z.literal("")).optional().nullable(),
  countryCode: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
})

export type SettingsOrgFormData = z.infer<typeof settingsOrgSchema>

export const editShipmentSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  recipientEmail: z
    .string()
    .email("Invalid email")
    .max(255)
    .or(z.literal(""))
    .optional(),
  recipientPhone: z.string().min(1, "Phone is required").max(20),
  branchId: z.string().min(1, "Branch is required"),
  billAmount: z.string().optional(),
})
export type EditShipmentFormData = z.infer<typeof editShipmentSchema>

export const verifyTotpSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
})
export type VerifyTotpFormData = z.infer<typeof verifyTotpSchema>

export const inviteUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  branchId: z.string().optional(),
  organisationId: z.string().optional(),
}).refine((data) => data.role !== "staff" || data.branchId, {
  message: "Branch is required for staff invitations",
  path: ["branchId"],
})
export type InviteUserFormData = z.infer<typeof inviteUserSchema>

export const createWebhookSchema = z.object({
  url: z.string().min(1, "URL is required").url("Invalid URL format"),
  events: z.array(z.string()).min(1, "Select at least one event"),
})
export type CreateWebhookFormData = z.infer<typeof createWebhookSchema>

export const quoteEditSchema = z.object({
  status: z.string().min(1, "Status is required"),
  price: z.string().optional(),
  remarks: z.string().optional(),
})
export type QuoteEditFormData = z.infer<typeof quoteEditSchema>

export const changeCarrierSchema = z.object({
  newCarrierCode: z.string().min(1, "New carrier is required"),
})
export type ChangeCarrierFormData = z.infer<typeof changeCarrierSchema>

export const createShipmentSchema = z.object({
  trackingNumber: z
    .string()
    .min(1, "Tracking number is required")
    .max(100)
    .regex(/^[a-zA-Z0-9\-]+$/, "Invalid tracking number format"),
  carrierCode: z.string().min(1, "Carrier is required"),
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  recipientEmail: z
    .string()
    .email("Invalid email")
    .max(255)
    .or(z.literal(""))
    .optional(),
  recipientPhone: z.string().min(1, "Phone is required").max(20),
  userId: z.string().optional(),
  branchId: z.string().optional(),
  billAmount: z.string().optional(),
})
export type CreateShipmentFormData = z.infer<typeof createShipmentSchema>
