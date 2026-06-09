import { useEffect, useCallback } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function useErrorToast() {
  const showError = useCallback(
    (error: unknown, fallback = "Something went wrong") => {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else if (error instanceof Error) {
        toast.error(error.message || fallback)
      } else {
        toast.error(fallback)
      }
    },
    []
  )

  return { showError }
}

export function useSuccessToast() {
  const showSuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])

  return { showSuccess }
}

export function useApiFeedback() {
  const { showError } = useErrorToast()
  const { showSuccess } = useSuccessToast()

  const handleResult = useCallback(
    async <T>(
      promise: Promise<T>,
      successMessage?: string
    ): Promise<T | null> => {
      try {
        const result = await promise
        if (successMessage) {
          showSuccess(successMessage)
        }
        return result
      } catch (error) {
        showError(error)
        return null
      }
    },
    [showError, showSuccess]
  )

  return { handleResult, showError, showSuccess }
}

export function useCopyToClipboard() {
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
      return true
    } catch {
      toast.error("Failed to copy")
      return false
    }
  }, [])

  return { copy }
}
