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

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Desktop injected wallet (MetaMask extension etc) */}
      {hasInjected && injectedConnector && (
        <button
          onClick={() => connect({ connector: injectedConnector, chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {/* Mobile: Valora deep link (primary Celo wallet) */}
      {isMobile && (
        <a
          href={`https://valoraapp.com/?privacy-policy=accepted`}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 block"
          onClick={(e) => {
            // Try to deep-link into Valora WC flow
            const wcUrl = encodeURIComponent(window.location.href);
            window.location.href = `celo://wallet?dappUrl=${wcUrl}`;
            // Fallback after 1s
            setTimeout(() => {
              window.location.href = "https://valoraapp.com";
            }, 1500);
            e.preventDefault();
          }}
        >
          Open in Valora
        </a>
      )}

      {/* WalletConnect for desktop */}
      {!isMobile && (
        <button
          onClick={async () => {
            if (!wcConnector) return;
            try {
              const { WalletConnectModal } = await import("@walletconnect/modal");
              const modal = new WalletConnectModal({
                projectId: "9401741cff120268fe4e4df8acbda44f",
                chains: ["eip155:42220"],
              });
              // Listen for the display_uri event to get the QR code URI
              wcConnector.emitter.on("message", ({ type, data }: { type: string; data?: unknown }) => {
                if (type === "display_uri") {
                  modal.openModal({ uri: data as string });
                }
              });
              connect({ connector: wcConnector, chainId: 42220 });
            } catch (e) {
              console.error("WalletConnect error:", e);
            }
          }}
          disabled={isPending}
          className="tap-compress bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 text-center font-semibold text-base disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect via WalletConnect"}
        </button>
      )}

      {/* Mobile: MetaMask deep link fallback */}
      {isMobile && (
        <a
          href={`https://metamask.app.link/dapp/celo.escrowhubs.io`}
          className="tap-compress bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 text-center font-semibold text-base block"
        >
          Open in MetaMask
        </a>
      )}
    </div>
  );
}
