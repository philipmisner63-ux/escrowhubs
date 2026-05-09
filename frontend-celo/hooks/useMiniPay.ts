"use client";
import { useEffect, useRef, useState } from "react";
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
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = (window as unknown as { ethereum?: unknown }).ethereum;
    const mp = typeof raw === "object" && raw !== null && (raw as Record<string, unknown>).isMiniPay === true;
    queueMicrotask(() => {
      setIsMiniPay(mp);
      setDetected(true);
      if (mp && !isConnected && !hasAttempted.current) {
        hasAttempted.current = true;
        connect({ connector: injected(), chainId: 42220 });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isMiniPay, detected };
}
