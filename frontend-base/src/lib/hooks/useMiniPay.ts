"use client";
import { useEffect, useState } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * MiniPay detection hook.
 * MiniPay is Opera'\''s stablecoin wallet (10M+ users, mobile-first, Celo).
 * When running inside MiniPay, auto-connect and switch to Celo (42220).
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect } = useConnect();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const miniPay = (window as any).ethereum?.isMiniPay;
    if (miniPay) {
      setIsMiniPay(true);
      connect({
        connector: injected(),
        chainId: 42220,
      });
    }
  }, [connect]);

  return { isMiniPay };
}

/** cUSD on Celo mainnet */
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

/** Default token per chain: Celo → cUSD, Base → USDC */
export function getDefaultToken(chainId: number): `0x${string}` {
  if (chainId === 42220) return CUSD_ADDRESS;
  return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
}
