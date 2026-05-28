'use client'

import { useState } from 'react'
import { api, setToken, setRefreshToken, notifyAuthChange } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldIcon, Loader2Icon, ArrowLeftIcon } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorChallengeProps {
  sessionToken: string
  email: string
  onComplete: () => void
  onBack: () => void
}

export function TwoFactorChallenge({ sessionToken, email, onComplete, onBack }: TwoFactorChallengeProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isBackup, setIsBackup] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.post<{ accessToken: string; refreshToken?: string }>('/auth/2fa/challenge', { sessionToken, code })
      setToken(data.accessToken)
      if (data.refreshToken) setRefreshToken(data.refreshToken)
      notifyAuthChange()
      onComplete()
    } catch {
      toast.error('Invalid code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldIcon className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </div>
        <CardDescription>
          {isBackup
            ? 'Enter one of your backup codes'
            : `Enter the 6-digit code sent to ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={isBackup ? 'Backup code' : '000000'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={isBackup ? 16 : 6}
            className="text-center text-lg tracking-widest"
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading || code.length < (isBackup ? 8 : 6)}>
            {loading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setIsBackup(!isBackup); setCode('') }}
          >
            {isBackup ? 'Use email code instead' : 'Use a backup code instead'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
