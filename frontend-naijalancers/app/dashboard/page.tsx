"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import EscrowABI from "@/lib/abi-SimpleEscrow.json";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";

const STATE_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  0: { label: "Awaiting Deposit", color: "text-amber-400", emoji: "⏳" },
  1: { label: "Funded", color: "text-[#35D07F]", emoji: "🔒" },
  2: { label: "Released", color: "text-blue-400", emoji: "✅" },
  3: { label: "Disputed", color: "text-red-400", emoji: "⚖️" },
  4: { label: "Refunded", color: "text-red-400", emoji: "↩️" },
};

type EscrowItem = {
  id: string;
  escrow_id: string;
  contract_address: string | null;
  on_chain_escrow_id: string | null;
  description: string | null;
  amount_usdc: number;
  status: string;
  buyer_wallet: string | null;
  seller_wallet: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWallet();
  const { showToast } = useToast();

  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const { writeContractAsync: release } = useWriteContract();

  useEffect(() => {
    async function fetchEscrows() {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/my-escrows?wallet=${address}`);
        const json = await res.json();
        if (json.success) {
          setEscrows(json.escrows);
        }
      } catch {
        showToast("Failed to load escrows", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchEscrows();
  }, [address, showToast]);

  async function handleRelease(escrow: EscrowItem) {
    if (!escrow.contract_address) return;
    setReleasingId(escrow.escrow_id);
    try {
      await release({
        address: escrow.contract_address as `0x${string}`,
        abi: EscrowABI,
        functionName: "release",
        gas: 200_000n,
      });

      showToast("Funds released!", "success");

      // Update backend
      await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrow_id: escrow.escrow_id,
          status: "RELEASED",
        }),
      });

      // Refresh list
      setEscrows((prev) =>
        prev.map((e) =>
          e.escrow_id === escrow.escrow_id ? { ...e, status: "RELEASED" } : e
        )
      );
    } catch (err: any) {
      console.error("[Release]", err);
      showToast(err?.shortMessage ?? "Release failed", "error");
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 px-5 py-12 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white mb-2">My Escrows</h1>
        <p className="text-white/60 mb-8">
          Track and manage your escrow transactions.
        </p>

        {!isConnected && (
          <GlassCard className="text-center py-12">
            <p className="text-white/70 mb-4">Connect your wallet to view your escrows</p>
            <GlowButton variant="primary" onClick={connectWallet}>
              Connect Wallet
            </GlowButton>
          </GlassCard>
        )}

        {isConnected && loading && (
          <GlassCard className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading...</p>
          </GlassCard>
        )}

        {isConnected && !loading && escrows.length === 0 && (
          <GlassCard className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white/70 mb-4">No escrows found</p>
            <Link href="/create" className="text-[#4A9EFF] text-sm">
              Create your first escrow →
            </Link>
          </GlassCard>
        )}

        {isConnected && !loading && escrows.length > 0 && (
          <div className="flex flex-col gap-4">
            {escrows.map((escrow) => {
              const stateNum =
                escrow.status === "PENDING_PAYMENT" ? 0 :
                escrow.status === "FUNDED" ? 1 :
                escrow.status === "RELEASED" ? 2 :
                escrow.status === "DISPUTED" ? 3 : 4;
              const stateInfo = STATE_LABELS[stateNum] ?? STATE_LABELS[0];
              const isSeller = address?.toLowerCase() === escrow.seller_wallet?.toLowerCase();
              const isBuyer = address?.toLowerCase() === escrow.buyer_wallet?.toLowerCase();

              return (
                <GlassCard key={escrow.escrow_id} className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        {escrow.description || "Escrow " + escrow.escrow_id.slice(0, 8)}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(escrow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${stateInfo.color}`}>
                      {stateInfo.emoji} {stateInfo.label}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Amount</span>
                    <span className="text-white font-semibold">{escrow.amount_usdc} cUSD</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Role</span>
                    <span className="text-white/70">
                      {isSeller ? "Seller" : isBuyer ? "Buyer" : "Observer"}
                    </span>
                  </div>

                  {escrow.contract_address && (
                    <div className="text-xs text-white/30 font-mono truncate">
                      {escrow.contract_address}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {escrow.contract_address && (
                      <Link
                        href={`/escrow/${escrow.contract_address}`}
                        className="flex-1 text-center bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        View Details
                      </Link>
                    )}

                    {isSeller && stateNum === 1 && escrow.contract_address && (
                      <GlowButton
                        variant="primary"
                        onClick={() => handleRelease(escrow)}
                        disabled={releasingId === escrow.escrow_id}
                        loading={releasingId === escrow.escrow_id}
                        className="flex-1"
                      >
                        Release Funds
                      </GlowButton>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
