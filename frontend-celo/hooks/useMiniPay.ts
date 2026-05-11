"use client";
import { useEffect, useRef, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * Detects MiniPay wallet and auto-connects on Celo.
 * MiniPay injects window.ethereum with isMiniPay = true.
 * Hardened: detects iframe + missing provider and bails with inline error.
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [detected, setDetected] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = (window as unknown as { ethereum?: unknown }).ethereum;
    const mp = typeof raw === "object" && raw !== null && (raw as Record<string, unknown>).isMiniPay === true;
    const isIframe = window.self !== window.top;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMiniPayUA = /MiniPay/i.test(ua);

    queueMicrotask(() => {
      setIsMiniPay(mp || isMiniPayUA);
      setDetected(true);

      // Iframe without provider = broken context (e.g. NaijaLancers iframe)
      if (isIframe && !raw) {
        setIframeError(
          "Wallet not available in this view. Please open EscrowHubs directly in MiniPay or your wallet browser."
        );
        return;
      }

      if ((mp || isMiniPayUA) && !isConnected && !hasAttempted.current) {
        hasAttempted.current = true;
        connect({ connector: injected(), chainId: 42220 });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isMiniPay, detected, iframeError, isIframe: typeof window !== "undefined" && window.self !== window.top };
}
