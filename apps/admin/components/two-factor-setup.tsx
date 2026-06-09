"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import {
  ShieldIcon,
  Loader2Icon,
  KeyIcon,
  CopyIcon,
  CheckIcon,
  MailIcon,
} from "lucide-react"

const verifyTotpSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
})
const disableTotpSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

type VerifyTotpForm = z.infer<typeof verifyTotpSchema>
type DisableTotpForm = z.infer<typeof disableTotpSchema>

interface TwoFactorStatus {
  enabled: boolean
  verified: boolean
}

interface TwoFactorVerify {
  backupCodes: string[]
}

export function TwoFactorSetup({ userId }: { userId: string }) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)
  const [disabling, setDisabling] = useState(false)

  const verifyForm = useForm<VerifyTotpForm>({
    resolver: zodResolver(verifyTotpSchema),
  })
  const disableForm = useForm<DisableTotpForm>({
    resolver: zodResolver(disableTotpSchema),
  })

  const verifyCodeValue = verifyForm.watch("code")
  const disablePasswordValue = disableForm.watch("password")

  const fetchStatus = async () => {
    try {
      const res = await api.get<TwoFactorStatus>("/auth/2fa/status")
      setStatus(res)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSetup = async () => {
    setLoading(true)
    try {
      await api.get<{ message: string }>("/auth/2fa/setup")
      setCodeSent(true)
      toast.success("Verification code sent to your email")
    } catch {
      toast.error("Failed to send verification code")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = verifyForm.handleSubmit(async (data) => {
    setVerifying(true)
    try {
      const res = await api.post<TwoFactorVerify>("/auth/2fa/verify", {
        token: data.code,
      })
      setBackupCodes(res.backupCodes)
      setCodeSent(false)
      verifyForm.reset()
      await fetchStatus()
    } catch {
      toast.error("Invalid code. Try again.")
    } finally {
      setVerifying(false)
    }
  })

  const handleDisable = disableForm.handleSubmit(async (data) => {
    setDisabling(true)
    try {
      await api.post("/auth/2fa/disable", { password: data.password })
      disableForm.reset()
      toast.success("2FA disabled")
      await fetchStatus()
    } catch {
      toast.error("Failed to disable 2FA. Check your password.")
    } finally {
      setDisabling(false)
    }
  })

  const handleRegenerateCodes = async () => {
    try {
      const res = await api.post<{ backupCodes: string[] }>(
        "/auth/2fa/regenerate-codes"
      )
      setBackupCodes(res.backupCodes)
      toast.success("New backup codes generated")
    } catch {
      toast.error("Failed to regenerate codes")
    }
  }

  const copyBackupCodes = () => {
    if (!backupCodes) return
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setBackupCodesCopied(true)
    setTimeout(() => setBackupCodesCopied(false), 2000)
  }

  if (!status) return null

  if (status.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-green-500" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            2FA is currently enabled on your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRegenerateCodes}>
              Regenerate Backup Codes
            </Button>
            <Button variant="outline" size="sm" onClick={copyBackupCodes}>
              {backupCodesCopied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              {backupCodesCopied ? "Copied" : "Copy Codes"}
            </Button>
          </div>
          {backupCodes && (
            <div className="rounded-md bg-muted p-3 font-mono text-xs">
              {backupCodes.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>
          )}
          <div className="border-t pt-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Enter your password to disable 2FA
            </p>
            <form onSubmit={handleDisable} className="flex gap-2">
              <div>
                <Input
                  type="password"
                  placeholder="Current password"
                  {...disableForm.register("password")}
                  className="max-w-xs"
                />
                {disableForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {disableForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={disabling || !disablePasswordValue}
              >
                {disabling ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : null}
                Disable
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (backupCodes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5" />
            Backup Codes
          </CardTitle>
          <CardDescription>
            Save these codes in a secure place. Each can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 font-mono text-sm">
            {backupCodes.map((c, i) => (
              <div key={i} className="py-0.5">
                {i + 1}. {c}
              </div>
            ))}
          </div>
          <Button onClick={copyBackupCodes}>
            {backupCodesCopied ? (
              <CheckIcon className="mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            {backupCodesCopied ? "Copied!" : "Copy Codes"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (codeSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="h-5 w-5" />
            Check Your Email
          </CardTitle>
          <CardDescription>
            We sent a 6-digit verification code to your email. Enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="mx-auto flex max-w-xs gap-2">
            <div>
              <Input
                placeholder="000000"
                {...verifyForm.register("code")}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              {verifyForm.formState.errors.code && (
                <p className="mt-1 text-sm text-red-500">
                  {verifyForm.formState.errors.code.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={verifying || (verifyCodeValue?.length ?? 0) < 6}
            >
              {verifying ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Code expires in 5 minutes.{" "}
            <button
              className="underline hover:text-foreground"
              onClick={handleSetup}
              disabled={loading}
            >
              Resend code
            </button>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSetup} disabled={loading}>
          {loading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Set Up Two-Factor Authentication
        </Button>
      </CardContent>
    </Card>
  )
}
