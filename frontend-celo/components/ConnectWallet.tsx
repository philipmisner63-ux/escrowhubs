"use client";
import { useConnect, useAccount, useDisconnect, useConfig } from "wagmi";

export function ConnectWallet() {
  const { connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const config = useConfig();

  // Get connectors registered in wagmi config
  const injectedConnector = config.connectors.find((c) => c.id === "injected");
  const wcConnector = config.connectors.find((c) => c.id === "walletConnect");

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
      {injectedConnector && (
        <button
          onClick={() => connect({ connector: injectedConnector, chainId: 42220 })}
          disabled={isPending}
          className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect Wallet (MetaMask / Valora)"}
        </button>
      )}
      {wcConnector && (
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
