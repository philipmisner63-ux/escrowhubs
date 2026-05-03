"use client";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

const WC_PROJECT_ID = "9401741cff120268fe4e4df8acbda44f";

export function ConnectWallet() {
  const { connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

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
      <button
        onClick={() => connect({ connector: injected(), chainId: 42220 })}
        disabled={isPending}
        className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 disabled:opacity-50"
      >
        {isPending ? "Connecting..." : "Connect Wallet (MetaMask / Valora)"}
      </button>
      <button
        onClick={() =>
          connect({
            connector: walletConnect({
              projectId: WC_PROJECT_ID,
              metadata: {
                name: "EscrowHubs",
                description: "Safe payments on Celo",
                url: "https://celo.escrowhubs.io",
                icons: ["https://celo.escrowhubs.io/icon.png"],
              },
            }),
            chainId: 42220,
          })
        }
        disabled={isPending}
        className="tap-compress bg-white/10 border border-white/20 text-white rounded-2xl px-6 py-4 text-center font-semibold text-base disabled:opacity-50"
      >
        {isPending ? "Connecting..." : "Connect via WalletConnect"}
      </button>
    </div>
  );
}
