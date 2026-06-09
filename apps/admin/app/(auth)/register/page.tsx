"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, ArrowLeft, CommandIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, restoreSession } from "@/lib/api"
import { AuthSidebar } from "@/components/auth-sidebar"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const emailParam = searchParams.get("email")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch("password") || ""

  const onSubmit = async (data: RegisterFormData) => {
    if (!token || !emailParam) {
      setError("Invalid invitation link")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await api.post<{
        accessToken: string
        user: { role: string; organisationId?: string }
      }>("/auth/register", {
        token,
        password: data.password,
        name: data.name,
      })

      if (res?.accessToken) {
        localStorage.setItem("track_access_token", res.accessToken)
        const user = await restoreSession()

        if (user?.organisationId) {
          localStorage.setItem("selectedOrganisationId", user.organisationId)
        }

        router.push("/dashboard")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!token || !emailParam) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <AuthSidebar />
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex items-center gap-2 text-center lg:hidden">
              <CommandIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">GT Express</h1>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Invalid Invitation</h2>
              <p className="mt-2 text-muted-foreground">
                This invitation link is invalid or has expired. Please contact
                the sender for a new invitation link.
              </p>
            </div>
            <a href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </a>
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
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
              <CommandIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">GT Express</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Create Your Account</h2>
            <p className="mt-1 text-muted-foreground">
              You&apos;ve been invited to join{" "}
              <span className="font-medium text-foreground">GT Express</span>.
              Set your name and password to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={emailParam} disabled />
              <p className="text-xs text-muted-foreground">
                This email was used for the invitation and cannot be changed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 12 characters"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
              {passwordValue && (
                <ul className="space-y-1 pt-1">
                  {[
                    { test: (p: string) => p.length >= 12, label: "At least 12 characters" },
                    { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
                    { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
                    { test: (p: string) => /[0-9]/.test(p), label: "One number" },
                  ].map((rule) => {
                    const passed = rule.test(passwordValue)
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                          {passed ? "✓" : "○"}
                        </span>
                        <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                className="h-4 w-4"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label
                htmlFor="showPassword"
                className="text-sm text-muted-foreground"
              >
                Show passwords
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
