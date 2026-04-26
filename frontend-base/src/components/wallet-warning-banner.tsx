"use client";

/**
 * WalletWarningBanner
 * Safe to render inside or outside WagmiProvider — guards via useContext check.
 * Used via dynamic import in Nav so it never blocks marketplace bundle.
 */

import { useContext } from "react";
import { WagmiContext } from "wagmi";
import { useAccount, useChainId } from "wagmi";
import { isChainSupported } from "@/lib/chains";

function BannerInner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) return null;
  if (!isChainSupported(chainId)) {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-xs text-yellow-300">
        ⚠️ Unsupported network — please switch to Base or Celo
      </div>
    );
  }
  return null;
}

export function WalletWarningBanner() {
  // Only render if inside a WagmiProvider — safe guard for marketplace routes
  const wagmiCtx = useContext(WagmiContext);
  if (!wagmiCtx) return null;
  return <BannerInner />;
}
