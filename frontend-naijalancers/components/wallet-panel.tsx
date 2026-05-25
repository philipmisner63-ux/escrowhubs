"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/session-provider";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { createPublicClient, http, formatEther } from "viem";
import { celo } from "viem/chains";
import { GlassCard } from "@/components/ui/glass-card";
import { WalletQR } from "@/components/wallet-qr";

const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

const erc20Abi = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
] as const;

const client = createPublicClient({ chain: celo, transport: http("https://rpc.ankr.com/celo") });

export function WalletPanel() {
  const { session } = useSession();
  const { address: externalAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const [balances, setBalances] = useState({ celo: "0", usdt: "0" });
  const [loading, setLoading] = useState(false);

  const walletAddress = session?.walletAddress;

  function refreshBalances() {
    if (!walletAddress) return;
    setLoading(true);
    Promise.all([
      client.getBalance({ address: walletAddress as `0x${string}` }),
      client.readContract({ address: USDT_CELO, abi: erc20Abi, functionName: "balanceOf", args: [walletAddress as `0x${string}`] }),
    ])
      .then(([celoBal, usdtBal]) => {
        setBalances({
          celo: parseFloat(formatEther(celoBal)).toFixed(4),
          usdt: (Number(usdtBal) / 1e6).toFixed(2),
        });
      })
      .catch(() => setBalances({ celo: "0", usdt: "0" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshBalances();
  }, [walletAddress]);

  if (!session) return null;

  return (
    <div className="space-y-4">
      {/* QR + Fund/Withdraw Card */}
      <WalletQR
        address={walletAddress || ""}
        balanceUsdt={balances.usdt}
        balanceCelo={balances.celo}
        onRefresh={refreshBalances}
        isExternal={isConnected && !!externalAddress}
      />

      {/* Loading state for balance */}
      {loading && (
        <div className="text-center py-2">
          <div className="w-4 h-4 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* External Wallets */}
      <GlassCard className="p-4" accentColor="cyan">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
          External Accounts
        </div>

        {isConnected && externalAddress ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-cyan-400/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/40">Connected Wallet</div>
                <div className="text-xs text-white font-mono truncate">
                  {externalAddress.slice(0, 10)}...{externalAddress.slice(-4)}
                </div>
              </div>
            </div>
            <button
              onClick={() => disconnect()}
              className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => connect({ connector: injected() })}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors">MetaMask</div>
                <div className="text-[10px] text-white/40">Browser extension</div>
              </div>
            </button>

            <button
              onClick={() => connect({ connector: walletConnect({ projectId: "9401741cff120268fe4e4df8acbda44f" }) })}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors">Valora / WalletConnect</div>
                <div className="text-[10px] text-white/40">Scan QR code</div>
              </div>
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
