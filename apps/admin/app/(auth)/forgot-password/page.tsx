"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, CheckCircle, CommandIcon, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { AuthSidebar } from "@/components/auth-sidebar"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email: data.email })
      setSuccess(true)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong"
      setError("email", { message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <AuthSidebar />
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
              If an account exists with this email, you will receive a password
              reset link shortly.
            </p>
            <div className="mt-6 rounded-xl border border-border/50 bg-muted/30 p-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The link expires in 1 hour for security. If you don&apos;t
                  see the email, check your spam folder or try again.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-8"
              onClick={() => router.push("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthSidebar />

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center gap-2 text-center lg:hidden">
            <CommandIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">GT Express</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Forgot password?</h2>
            <p className="mt-1 text-muted-foreground">
              No worries. Enter your email and we&apos;ll send you a reset
              link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                For security, reset links are valid for 1 hour and can only be
                used once. We never share your email with third parties.
            </p>
            </div>
          </div>

          <p className="text-center text-sm">
            <a
              href="/login"
              className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
