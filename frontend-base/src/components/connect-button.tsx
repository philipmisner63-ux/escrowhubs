"use client";

import { useEffect, useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useDisconnect } from "wagmi";

export function WalletConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
