"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, "")

export function useSocketRefresh(
  resource: string,
  onInvalidate: () => void,
  enabled = true,
) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem("track_access_token")
    if (!token) return

    let orgId = ""
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      orgId = payload.organisationId
    } catch {
      return
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      if (orgId) socket.emit("join-organisation", orgId)
    })

    socket.on(`invalidate:${resource}`, () => {
      onInvalidate()
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [resource, onInvalidate, enabled])
}
