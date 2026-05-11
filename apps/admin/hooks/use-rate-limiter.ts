"use client"

import { useState, useCallback, useRef } from "react"

interface RateLimiterOptions {
  maxAttempts: number
  windowMs: number
  cooldownMs?: number
}

interface RateLimiterState {
  attempts: number
  isLocked: boolean
  lockExpiresAt: number | null
  lastAttemptAt: number | null
}

export function useRateLimiter(options: RateLimiterOptions) {
  const { maxAttempts, windowMs, cooldownMs = 0 } = options
  const [state, setState] = useState<RateLimiterState>({
    attempts: 0,
    isLocked: false,
    lockExpiresAt: null,
    lastAttemptAt: null,
  })
  
  const attemptsRef = useRef<number[]>([])

  const canAttempt = useCallback((): boolean => {
    const now = Date.now()
    
    // Clean up old attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    )
    
    // Check if currently locked
    if (state.isLocked && state.lockExpiresAt && now < state.lockExpiresAt) {
      return false
    }
    
    // Check if within attempt limit
    if (attemptsRef.current.length >= maxAttempts) {
      return false
    }
    
    return true
  }, [maxAttempts, windowMs, state.isLocked, state.lockExpiresAt])

  const recordAttempt = useCallback((success: boolean = false) => {
    const now = Date.now()
    
    attemptsRef.current.push(now)
    
    if (!success && attemptsRef.current.length >= maxAttempts) {
      // Lock the rate limiter
      setState({
        attempts: attemptsRef.current.length,
        isLocked: true,
        lockExpiresAt: now + cooldownMs,
        lastAttemptAt: now,
      })
    } else {
      setState(prev => ({
        ...prev,
        attempts: attemptsRef.current.length,
        lastAttemptAt: now,
        isLocked: false,
        lockExpiresAt: null,
      }))
    }
  }, [maxAttempts, cooldownMs])

  const getRemainingTime = useCallback((): number => {
    if (!state.isLocked || !state.lockExpiresAt) return 0
    return Math.max(0, state.lockExpiresAt - Date.now())
  }, [state.isLocked, state.lockExpiresAt])

  const reset = useCallback(() => {
    attemptsRef.current = []
    setState({
      attempts: 0,
      isLocked: false,
      lockExpiresAt: null,
      lastAttemptAt: null,
    })
  }, [])

  return {
    canAttempt: canAttempt(),
    attempts: state.attempts,
    isLocked: state.isLocked,
    remainingTime: getRemainingTime(),
    recordAttempt,
    reset,
  }
}
