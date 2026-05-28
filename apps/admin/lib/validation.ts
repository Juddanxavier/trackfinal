import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fieldErrors<T>(result: { success: true } | { success: false; error: any }): Partial<Record<keyof T, string>> {
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
  email: z.string().email("Invalid email").max(255).or(z.literal("")).optional(),
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
  name: z.string().min(1, "Branch name is required").max(200, "Name is too long"),
  email: z.string().email("Invalid email").max(255).or(z.literal("")).optional(),
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
  role: z.string().optional(),
})

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  message: z.string().min(1, "Message is required").max(5000),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export const quoteEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(500, "Subject is too long"),
  message: z.string().max(5000).optional(),
})

export type QuoteEmailFormData = z.infer<typeof quoteEmailSchema>

export const settingsOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().email("Invalid email").max(255).or(z.literal("")).optional().nullable(),
  phone: z.string().max(20).or(z.literal("")).optional().nullable(),
  address: z.string().max(500).or(z.literal("")).optional().nullable(),
  city: z.string().max(100).or(z.literal("")).optional().nullable(),
  state: z.string().max(100).or(z.literal("")).optional().nullable(),
  postalCode: z.string().max(20).or(z.literal("")).optional().nullable(),
  countryCode: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
})

export type SettingsOrgFormData = z.infer<typeof settingsOrgSchema>
