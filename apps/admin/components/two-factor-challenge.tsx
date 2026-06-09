"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api, setToken, setRefreshToken, notifyAuthChange } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldIcon, Loader2Icon, ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

const emailCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
})
const backupCodeSchema = z.object({
  code: z.string().min(8, "Backup code must be at least 8 characters"),
})

type ChallengeForm = z.infer<typeof emailCodeSchema>

interface TwoFactorChallengeProps {
  sessionToken: string
  email: string
  onComplete: () => void
  onBack: () => void
}

export function TwoFactorChallenge({
  sessionToken,
  email,
  onComplete,
  onBack,
}: TwoFactorChallengeProps) {
  const [loading, setLoading] = useState(false)
  const [isBackup, setIsBackup] = useState(false)

  const schema = isBackup ? backupCodeSchema : emailCodeSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ChallengeForm>({
    resolver: zodResolver(schema),
  })

  const code = watch("code")

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true)
    try {
      const result = await api.post<{
        accessToken: string
        refreshToken?: string
      }>("/auth/2fa/challenge", { sessionToken, code: data.code })
      setToken(result.accessToken)
      if (result.refreshToken) setRefreshToken(result.refreshToken)
      notifyAuthChange()
      onComplete()
    } catch {
      toast.error("Invalid code. Try again.")
    } finally {
      setLoading(false)
    }
  })

  const toggleBackup = () => {
    setIsBackup((prev) => !prev)
    reset({ code: "" })
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldIcon className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </div>
        <CardDescription>
          {isBackup
            ? "Enter one of your backup codes"
            : `Enter the 6-digit code sent to ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Input
              placeholder={isBackup ? "Backup code" : "000000"}
              {...register("code")}
              maxLength={isBackup ? 16 : 6}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !code}>
            {loading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Verify
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={toggleBackup}
          >
            {isBackup ? "Use email code instead" : "Use a backup code instead"}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
