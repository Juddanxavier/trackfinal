"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  CheckCircle,
  ArrowLeft,
  CommandIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import bglogin from "@/public/bglogin.png"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Invalid reset token")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.post("/auth/reset-password", {
        token,
        password: data.password,
      })
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden h-screen lg:flex">
          <Image src={bglogin} alt="Background" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
              <CommandIcon className="h-6 w-6 text-white" />
              <h1 className="text-xl font-bold text-white">GT Express</h1>
            </div>
            <p className="mt-3 text-base text-white/60">
              Your complete shipment tracking solution
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Invalid Link</h2>
              <p className="mt-2 text-muted-foreground">
                This password reset link is invalid or has expired.
              </p>
            </div>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request New Link
            </Button>
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

  if (success) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden h-screen lg:flex">
          <Image src={bglogin} alt="Background" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
              <CommandIcon className="h-6 w-6 text-white" />
              <h1 className="text-xl font-bold text-white">GT Express</h1>
            </div>
            <p className="mt-3 text-base text-white/60">
              Your complete shipment tracking solution
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Password Reset</h2>
              <p className="mt-2 text-muted-foreground">
                Your password has been successfully reset. Redirecting to
                login...
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden h-screen lg:flex">
        <Image src={bglogin} alt="Background" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-8">
          <div className="inline-flex items-center gap-3 rounded-md border border-black/10 bg-black/50 px-6 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
            <CommandIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-white">GT Express</h1>
          </div>
          <p className="mt-3 text-base text-white/60">
            Your complete shipment tracking solution
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
              <img
                src="/logo.ico"
                alt="GT Express"
                className="h-8 w-8 rounded-lg object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">Track</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="mt-1 text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen w-full lg:grid-cols-2">
          <div className="relative hidden h-screen lg:flex">
            <Image
              src={bglogin}
              alt="Background"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-8">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
                <CommandIcon className="h-6 w-6 text-white" />
                <h1 className="text-xl font-bold text-white">GT Express</h1>
              </div>
              <p className="mt-3 text-base text-white/60">
                Your complete shipment tracking solution
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
