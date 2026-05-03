"use client";
import { useConnect, useAccount, useDisconnect, useConfig } from "wagmi";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const { connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const injectedConnector = config.connectors.find((c) => c.id === "injected");
  const wcConnector = config.connectors.find((c) => c.id === "walletConnect");
  const hasInjected = typeof window !== "undefined" && !!(window as any).ethereum;

  if (isConnected && address) {
    return (
      <div className="flex items-center justify-between bg-white/[0.08] border border-white/10 border-l-4 border-l-[#35D07F] rounded-2xl px-4 py-3 mb-6">
        <span className="text-sm text-white font-medium">
          {address.slice(0, 6)}...{address.slice(-4)} · Celo
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // On mobile with no injected wallet: guide user into a wallet browser (no app-switching = no page reload)
  const isExternalMobileBrowser = isMobile && !hasInjected;
  const isMobileWithInjected = isMobile && hasInjected;

  return (
    <div className="flex flex-col gap-3 mb-6">

      {/* Mobile without injected wallet — primary CTA: open inside wallet browser */}
      {isExternalMobileBrowser && (
        <>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 text-xs text-amber-300">
            <p className="font-semibold mb-0.5">📱 Open inside your wallet browser</p>
            <p className="text-amber-300/70">Multi-step transactions require running inside MetaMask or Valora — not an external browser.</p>
          </div>
          <a
            href={`https://metamask.app.link/dapp/celo.escrowhubs.io${window?.location?.pathname ?? ""}`}
            className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 block"
          >
            🦊 Open in MetaMask Browser
          </a>
          <a
            href={`celo://wallet?dappUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "https://celo.escrowhubs.io")}`}
            className="tap-compress bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 text-center font-semibold text-base block"
          >
            🌿 Open in Valora
          </a>
        </>
      )}

      {/* Mobile with injected wallet (already inside MM/Valora browser) — connect normally */}
      {isMobileWithInjected && injectedConnector && (
        <button
          onClick={() => connect({ connector: injectedConnector, chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {/* Desktop: injected wallet (MetaMask extension) */}
      {!isMobile && hasInjected && injectedConnector && (
        <button
          onClick={() => connect({ connector: injectedConnector, chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {/* Desktop: WalletConnect fallback */}
      {!isMobile && wcConnector && (
        <button
          onClick={() => connect({ connector: wcConnector, chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 text-center font-semibold text-base disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect via WalletConnect"}
        </button>
      )}
    </div>
  );
}
