"use client";

/**
 * WalletWarningBanner
 * Safe to render inside or outside WagmiProvider — guards via useContext check.
 * Used via dynamic import in Nav so it never blocks marketplace bundle.
 */

import { useContext } from "react";
import { WagmiContext } from "wagmi";
import { useAccount, useChainId } from "wagmi";
import { useTranslations } from "next-intl";
import { DEFAULT_CHAIN_ID, getChain } from "@/lib/chains";

function BannerInner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const t = useTranslations("nav");

  if (!isConnected) return null;
  if (chainId !== DEFAULT_CHAIN_ID) {
    const target = getChain(DEFAULT_CHAIN_ID);
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-xs text-yellow-300">
        ⚠️ {t("wrongNetwork", { name: target.chain.name, chainId: DEFAULT_CHAIN_ID })}
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
