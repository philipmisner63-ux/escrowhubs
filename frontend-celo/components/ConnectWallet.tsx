"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const { disconnect } = useDisconnect();
  const { connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const [hasInjected, setHasInjected] = useState(false);

  useEffect(() => {
    // Detect injected provider (inside MetaMask, Valora, or MiniPay browser)
    setHasInjected(typeof window !== "undefined" && !!(window as any).ethereum);
  }, []);

  // Connected state — same for all paths
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

  // Inside wallet browser (MetaMask, Valora, MiniPay) — skip modal, connect directly.
  // RainbowKit's modal buttons are dead in MetaMask's WebView; direct injected() call works fine.
  if (hasInjected) {
    return (
      <div className="mb-6">
        <button
          onClick={() => connect({ connector: injected(), chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 w-full disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>
    );
  }

  // External browser (no injected wallet) — use RainbowKit modal for WalletConnect etc.
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => (
        <div className="mb-6">
          <button
            onClick={openConnectModal}
            disabled={!mounted}
            className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 w-full disabled:opacity-50"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </ConnectButton.Custom>
  );
}
