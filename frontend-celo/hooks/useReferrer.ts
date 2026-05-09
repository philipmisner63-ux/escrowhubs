"use client"
import { useEffect, useState } from "react"
import { detectContext } from "@/lib/context"
import { useSearchParams } from "next/navigation"

const NAIJALANCERS_REFERRER = "0x7ed3d953ad3ef99f101f4808d4c123052c583282"
const REFERRER_KEY = "eh_referrer"
const REFERRER_EXPIRY_KEY = "eh_referrer_expiry"
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export function useReferrer(): `0x${string}` {
  const [referrer, setReferrer] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000")
  const searchParams = useSearchParams()

  useEffect(() => {
    async function resolve() {
      // Priority 1: NaijaLancers iframe context
      const ctx = await detectContext()
      if (ctx === "naijalancers") {
        setReferrer(NAIJALANCERS_REFERRER)
        return
      }

      // Priority 2: ?ref= URL param — store with 90-day expiry (last-touch overwrites)
      const refParam = searchParams.get("ref")
      if (refParam && refParam.startsWith("0x") && refParam.length === 42) {
        const expiry = Date.now() + NINETY_DAYS_MS
        localStorage.setItem(REFERRER_KEY, refParam)
        localStorage.setItem(REFERRER_EXPIRY_KEY, expiry.toString())
        setReferrer(refParam as `0x${string}`)
        return
      }

      // Priority 3: localStorage — check expiry
      const stored = localStorage.getItem(REFERRER_KEY)
      const expiry = localStorage.getItem(REFERRER_EXPIRY_KEY)
      if (stored && expiry && Date.now() < parseInt(expiry)) {
        setReferrer(stored as `0x${string}`)
        return
      }

      // Expired — clean up
      if (stored) {
        localStorage.removeItem(REFERRER_KEY)
        localStorage.removeItem(REFERRER_EXPIRY_KEY)
      }

      // Priority 4: zero address (no referrer)
    }
    resolve()
  }, [searchParams])

  return referrer
}
