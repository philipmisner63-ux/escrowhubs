"use client";

import { useEffect, useState, useContext } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiContext } from "wagmi";

export function WalletConnectButton() {
  const wagmiCtx = useContext(WagmiContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!wagmiCtx) return null;

  if (!mounted) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 opacity-50"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
  );
}
