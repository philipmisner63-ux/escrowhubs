"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId, useBlockNumber } from "wagmi";

const BUILD_AT = new Date().toISOString();

function useDebugTrigger() {
  const [visible, setVisible] = useState(false);
  const taps = useRef<{ time: number; y: number }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("debug") === "1") {
      setVisible(true);
      return;
    }

    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return;
      const now = Date.now();
      if (touch.clientY > 80) return;
      taps.current = taps.current.filter((t) => now - t.time < 3000);
      taps.current.push({ time: now, y: touch.clientY });
      if (taps.current.length >= 5) {
        setVisible(true);
        taps.current = [];
      }
    };

    const onClick = (e: MouseEvent) => {
      const now = Date.now();
      if ((e as unknown as { clientY?: number }).clientY ?? 0 > 80) return;
      taps.current = taps.current.filter((t) => now - t.time < 3000);
      taps.current.push({ time: now, y: (e as unknown as { clientY?: number }).clientY ?? 0 });
      if (taps.current.length >= 5) {
        setVisible(true);
        taps.current = [];
      }
    };

    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return visible;
}

function detectWalletType(): string {
  if (typeof window === "undefined") return "none";
  const eth = (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
  if (!eth) return "none";
  if (eth.isMiniPay) return "MiniPay";
  if (eth.isMetaMask) return "MetaMask";
  if (eth.isRainbow) return "Rainbow";
  return "injected";
}

export function DebugPanel() {
  const visible = useDebugTrigger();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: blockNumber } = useBlockNumber({ watch: false });
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  const walletType = detectWalletType();
  const rpcReachable = blockNumber != null;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        right: 12,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        border: "1px solid #00f5ff",
        borderRadius: 12,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#00f5ff",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <strong style={{ color: "#fff" }}>Debug</strong>
        <button onClick={() => window.location.reload()} style={{ color: "#fff", fontSize: 11 }}>
          Reload →
        </button>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <span>Chain ID</span>
        <span>{chainId ?? "--"}</span>
        <span>Wallet</span>
        <span>{walletType}</span>
        <span>Iframe</span>
        <span>{isIframe ? "yes" : "no"}</span>
        <span>RPC</span>
        <span>{rpcReachable ? "yes" : "checking"}</span>
        <span>Account</span>
        <span className="truncate">{isConnected && address ? address : "disconnected"}</span>
        <span>Build</span>
        <span className="truncate">{BUILD_AT}</span>
      </div>
    </div>
  );
}
