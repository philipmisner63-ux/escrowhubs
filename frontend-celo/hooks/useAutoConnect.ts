"use client"
import { useEffect, useState } from "react"
import { useConnect, useConnectors } from "wagmi"
import { detectContext } from "@/lib/context"

export function useAutoConnect() {
  const connectors = useConnectors()
  const { connect, error, isPending } = useConnect()
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    if (hasAttempted || connectors.length === 0) return

    const attemptConnect = async () => {
      const ctx = await detectContext()
      if (ctx !== "minipay") {
        setHasAttempted(true)
        return
      }
      try {
        await connect({ connector: connectors[0] })
      } catch (err) {
        console.error("Auto-connect failed:", err)
      }
      setHasAttempted(true)
    }

    attemptConnect()
  }, [connectors, connect, hasAttempted])

  return { error, isPending }
}
