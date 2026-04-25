"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAddress } from "viem";

const STORAGE_KEY  = "escrowhubs_referrer";
const EXPIRY_KEY   = "escrowhubs_referrer_expiry";
const EXPIRY_DAYS  = 30;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Resolves the current referral address from the URL or stored referral state.
 *
 * Stores valid `ref` query parameters for the referral expiry window and falls back to the zero address.
 */
export function useReferrer(): `0x${string}` {
  const searchParams = useSearchParams();
  const [referrer, setReferrer] = useState<`0x${string}`>(ZERO_ADDRESS);

  useEffect(() => {
    const refParam = searchParams?.get("ref");
    if (refParam && isAddress(refParam)) {
      localStorage.setItem(STORAGE_KEY, refParam);
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + EXPIRY_DAYS * 86_400_000));
      setReferrer(refParam as `0x${string}`);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (stored && expiry && Date.now() < Number(expiry) && isAddress(stored)) {
      setReferrer(stored as `0x${string}`);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      setReferrer(ZERO_ADDRESS);
    }
  }, [searchParams]);

  return referrer;
}
