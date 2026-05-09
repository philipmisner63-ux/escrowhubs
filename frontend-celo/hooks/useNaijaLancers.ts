"use client";
import { useEffect, useState, useCallback } from "react"

const ALLOWED_ORIGINS = (
  process.env.NEXT_PUBLIC_NAIJALANCERS_ORIGIN ?? "https://naijalancers.name.ng"
).split(",")

export interface NaijaLancersMessage {
  type: "chargeUser" | "payoutUser" | "getEscrowStatus"
  payload: Record<string, unknown>
}

export function useNaijaLancers() {
  const [lastMessage, setLastMessage] = useState<NaijaLancersMessage | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Validate message structure
      if (typeof event.data?.type !== "string") return
      const validTypes = ["chargeUser", "payoutUser", "getEscrowStatus"]
      if (!validTypes.includes(event.data.type)) return

      // Trim whitespace from origin matching
      const trimmedOrigins = ALLOWED_ORIGINS.map(o => o.trim())
      if (!trimmedOrigins.includes(event.origin)) {
        console.warn("Rejected postMessage from unauthorized origin:", event.origin)
        return
      }
      setLastMessage(event.data as NaijaLancersMessage)
    }

    window.addEventListener("message", handler)
    // Signal ready to parent
    window.parent.postMessage({ type: "escrowhubs:ready" }, ALLOWED_ORIGINS[0])
    setIsReady(true)

    return () => window.removeEventListener("message", handler)
  }, [])

  const sendToParent = useCallback((type: string, payload: Record<string, unknown>) => {
    const origin = ALLOWED_ORIGINS[0]
    window.parent.postMessage({ type: `escrowhubs:${type}`, payload }, origin)
  }, [])

  return { lastMessage, isReady, sendToParent }
}
