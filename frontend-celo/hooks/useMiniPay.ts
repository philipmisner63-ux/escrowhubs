"use client";
import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * Detects MiniPay wallet and auto-connects on Celo.
 * MiniPay injects window.ethereum with isMiniPay = true.
 * No "Connect Wallet" button needed — it just works.
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [detected, setDetected] = useState(false);
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mp = (window as any).ethereum?.isMiniPay;
    setIsMiniPay(!!mp);
    setDetected(true);
    if (mp && !isConnected) {
      connect({ connector: injected(), chainId: 42220 });
    }
  }, [connect, isConnected]);

  return { isMiniPay, detected };
}
