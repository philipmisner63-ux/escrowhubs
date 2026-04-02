"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

const BLOCKDAG_CHAIN_ID = 1404;

function AutoSwitchChain() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== BLOCKDAG_CHAIN_ID) {
      switchChain?.({ chainId: BLOCKDAG_CHAIN_ID });
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
      <AutoSwitchChain />
      <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
    </>
  );
}
