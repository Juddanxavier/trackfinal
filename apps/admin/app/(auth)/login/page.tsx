"use client"

export const metadata = {
  title: 'Login - GT Express',
}

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import bglogin from "@/public/bglogin.png"
import { Eye, EyeOff, Loader2, CommandIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, setAccessToken } from "@/lib/api"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect") || "/dashboard"
  const redirect =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("/../")
      ? rawRedirect
      : "/dashboard"
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const res = await api.post<{ accessToken: string }>("/auth/login", {
        email: data.email,
        password: data.password,
      })
      if (res.accessToken) {
        setAccessToken(res.accessToken, 900)
        window.location.href = redirect
        return
      }
    } catch (err: any) {
      setError("password", { message: err.message || "Invalid credentials" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden h-screen lg:flex">
        <Image src={bglogin} alt="Background" fill className="object-cover" />
        <div className="absolute right-0 bottom-0 left-0 p-8">
          <div className="inline-flex items-center gap-3 rounded-md border border-black/10 bg-black/50 px-6 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
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
          <div className="flex justify-center gap-2 text-center lg:hidden">
            <CommandIcon className="h-8 w-8 text-primary" />

            <h1 className="text-2xl font-bold">GT Express</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-muted-foreground">
              Enter your credentials to continue
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <a
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
