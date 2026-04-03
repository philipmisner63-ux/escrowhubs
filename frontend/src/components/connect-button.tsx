"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN_ID } from "@/lib/chains";

// ChainGuard: silently switches to the default chain on connect.
// Wrong-network UI feedback is handled by the nav banner (nav.tsx).
function ChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== DEFAULT_CHAIN_ID) {
      switchChain?.({ chainId: DEFAULT_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  return null;
}

export function WalletConnectButton() {
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

  return (
    <>
      <ChainGuard />
      <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
    </>
  );
}
