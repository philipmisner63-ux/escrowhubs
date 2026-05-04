"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        if (!mounted) {
          return (
            <div
              aria-hidden
              className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base opacity-0 mb-6"
            />
          );
        }

        if (connected) {
          return (
            <div className="flex items-center justify-between bg-white/[0.08] border border-white/10 border-l-4 border-l-[#35D07F] rounded-2xl px-4 py-3 mb-6">
              <span className="text-sm text-white font-medium">
                {account.address.slice(0, 6)}...{account.address.slice(-4)} · Celo
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
          <div className="mb-6">
            <button
              onClick={openConnectModal}
              className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 text-center font-bold text-base shadow-lg shadow-green-900/30 w-full"
            >
              Connect Wallet
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
