"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Nav } from "@/components/nav";
import { PageWrapper } from "@/components/page-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddressDisplay } from "@/components/ui/address-display";
import { useWalletEscrows, useFactoryEscrows } from "@/lib/hooks/useEscrowFactory";
import { SIMPLE_STATE_LABEL } from "@/lib/contracts";
import { getViewedEscrows, type ViewedEscrow } from "@/lib/localStorage";

function isValidAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function stateToStatus(stateNum: number): "pending" | "active" | "complete" | "disputed" {
  if (stateNum === 0) return "pending";
  if (stateNum === 1) return "active";
  if (stateNum === 2) return "complete";
  if (stateNum === 3) return "disputed";
  return "pending";
}

export default function DashboardPage() {
  const router = useRouter();
  const { address: wallet } = useAccount();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [viewed, setViewed] = useState<ViewedEscrow[]>([]);

  const { asDepositor, asBeneficiary, isLoading: walletLoading } = useWalletEscrows(wallet);
  const { records: allRecords, isLoading: recordsLoading } = useFactoryEscrows(0n, 50n);

  // Combine depositor + beneficiary indices, deduplicate
  const myIndices = Array.from(new Set([...asDepositor, ...asBeneficiary].map(n => Number(n))));
  const myEscrows = myIndices.map(i => allRecords[i]).filter(Boolean);

  useEffect(() => {
    setViewed(getViewedEscrows());
  }, []);

  function handleLoad() {
    const addr = input.trim();
    if (!isValidAddress(addr)) {
      setError("Enter a valid contract address (0x + 40 hex chars)");
      return;
    }
    setError("");
    router.push(`/escrow/${addr}`);
  }

  const isLoading = walletLoading || recordsLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageWrapper>
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">Manage your escrow contracts on BlockDAG</p>
              </div>
              <Link href="/create">
                <GlowButton variant="primary">+ New Escrow</GlowButton>
              </Link>
            </div>

            {/* My Escrows */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
                My Escrows
              </h2>
              {!wallet ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">Connect your wallet to see your escrows.</p>
                </GlassCard>
              ) : isLoading ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm animate-pulse">Loading escrows…</p>
                </GlassCard>
              ) : myEscrows.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No escrows found for your wallet.</p>
                  <p className="text-slate-600 text-xs mt-1">Create one or paste an address below.</p>
                </GlassCard>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myEscrows.map(e => (
                    <Link key={e.contractAddress} href={`/escrow/${e.contractAddress}`}>
                      <GlassCard className="p-4 cursor-pointer hover:border-cyan-400/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={e.depositor?.toLowerCase() === wallet?.toLowerCase() ? "active" : "pending"} />
                          <span className="text-xs text-slate-500">
                            {e.escrowType === 0 ? "Simple" : "Milestone"}
                          </span>
                        </div>
                        <AddressDisplay address={e.contractAddress} />
                        <p className="text-xs text-slate-500 mt-2">
                          {(Number(e.totalAmount) / 1e18).toFixed(4)} BDAG
                        </p>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Load by address */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Load Escrow by Address
              </h2>
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLoad()}
                  placeholder="0x..."
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
                />
                <GlowButton variant="primary" onClick={handleLoad}>Load</GlowButton>
              </div>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </GlassCard>

            {/* Recently Viewed */}
            {viewed.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Recently Viewed
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {viewed.map(e => (
                    <Link key={e.address} href={`/escrow/${e.address}`}>
                      <GlassCard className="p-4 cursor-pointer hover:border-cyan-400/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={e.type === "unknown" ? "pending" : e.type} />
                          <span className="text-xs text-slate-600">
                            {new Date(e.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {e.title && <p className="text-sm font-medium text-white mb-1">{e.title}</p>}
                        <AddressDisplay address={e.address} />
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
