"use client"
import { useEffect, useState } from "react"
import { detectContext, type AppContext } from "@/lib/context"
import { useAutoConnect } from "@/hooks/useAutoConnect"

export function ClientContext({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AppContext>("browser")
  useAutoConnect() // side effect: auto-connects wagmi connector[0] in MiniPay context

  useEffect(() => {
    detectContext().then(setContext)
  }, [])

  // MiniPay mode — auto-connect running silently
  if (context === "minipay") {
    return <>{children}</>
  }

  // NaijaLancers iframe mode — postMessage handles everything
  if (context === "naijalancers") {
    return <>{children}</>
  }

  // Browser mode — show connect buttons normally
  return <>{children}</>
}
