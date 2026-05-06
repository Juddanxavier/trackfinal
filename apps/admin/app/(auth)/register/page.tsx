"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { Eye, EyeOff, Loader2, ArrowLeft, CommandIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, setAccessToken, getMe } from "@/lib/api"
import bglogin from "@/public/bglogin.png"

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
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (!token || !emailParam) {
      setError("Invalid invitation link")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await api.post<{ accessToken: string; user: any }>(
        "/auth/register",
        {
          token,
          password: data.password,
          name: data.name,
        }
      )
      if (res?.accessToken) {
        setAccessToken(res.accessToken)
        const user = await getMe()
        if (user?.organisationId) {
          const org = await api.get<any>(
            `/organisations/${user.organisationId}`
          )
          if (org?.name) {
            localStorage.setItem("selectedOrganisationId", user.organisationId)
            window.location.reload()
            return
          }
        }
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (!token || !emailParam) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden h-screen lg:flex">
          <Image src={bglogin} alt="Background" fill className="object-cover" />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/20" /> */}
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
              Set your password to complete registration
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={emailParam} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
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
