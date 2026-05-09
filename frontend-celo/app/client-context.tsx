"use client"
import { useEffect, useState } from "react"
import { detectContext, type AppContext } from "@/lib/context"
import { useAutoConnect } from "@/hooks/useAutoConnect"
import { useNaijaLancers } from "@/hooks/useNaijaLancers"

function NaijaLancersListener() {
  useNaijaLancers()
  return null
}

export function ClientContext({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AppContext>("browser")
  useAutoConnect() // side effect: auto-connects wagmi connector[0] in MiniPay context

  useEffect(() => {
    detectContext().then(setContext)
  }, [])

  return (
    <>
      {context === "naijalancers" && <NaijaLancersListener />}
      {children}
    </>
  )
}
