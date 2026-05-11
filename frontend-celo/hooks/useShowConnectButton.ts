"use client"
import { useEffect, useState } from "react"
import { detectContext } from "@/lib/context"

export function useShowConnectButton() {
  const [showConnect, setShowConnect] = useState(false)
  useEffect(() => {
    detectContext().then((ctx) => {
      setShowConnect(ctx === "browser")
    })
  }, [])
  return showConnect
}
