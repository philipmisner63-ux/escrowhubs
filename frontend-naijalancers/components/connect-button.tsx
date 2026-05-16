"use client";

import { useWallet } from "@/hooks/useWallet";

export function ConnectButton() {
  const { isConnected, isConnecting, connectWallet, disconnect, address } = useWallet();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 text-sm font-medium"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-[#35D07F] text-black rounded-xl px-4 py-2 text-sm font-bold"
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
