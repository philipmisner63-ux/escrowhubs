"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Hydration guard: SSR renders placeholder, client swap-in avoids hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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
