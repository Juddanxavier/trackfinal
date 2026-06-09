"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

type FetchFn<T> = () => Promise<T>

export function useQuery<T>(fetchFn: FetchFn<T>, enabled = true) {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const mounted = useRef(true)
  const fnRef = useRef<FetchFn<T>>(fetchFn)

  useEffect(() => {
    fnRef.current = fetchFn
  }, [fetchFn])

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fnRef.current()
      if (mounted.current) {
        setState({ data, loading: false, error: null })
      }
    } catch (err) {
      if (mounted.current) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "An error occurred",
        })
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh()
    }
    return () => {
      mounted.current = false
    }
  }, [refresh, enabled])

  return { ...state, refresh }
}
