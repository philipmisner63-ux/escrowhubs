"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@/components/privy-provider";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { Link } from "@/i18n/navigation";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import type { MarketplaceEscrow } from "@/lib/supabase";
import { SimpleEscrowABI } from "@/lib/contracts";

type EscrowStatus = MarketplaceEscrow["status"];

const STATUS_LABEL: Record<EscrowStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  FUNDED: "Funded",
  RELEASED: "Released",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<EscrowStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  FUNDED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  RELEASED: "bg-green-500/15 text-green-400 border-green-500/30",
  DISPUTED: "bg-red-500/15 text-red-400 border-red-500/30",
  REFUNDED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  CANCELLED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function StatusBadge({ status }: { status: EscrowStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface EscrowCardProps {
  escrow: MarketplaceEscrow;
  role: "seller" | "buyer";
  userEmail: string;
  onRelease: (escrow: MarketplaceEscrow) => void;
  releasing: string | null;
}

function EscrowCard({ escrow, role, userEmail, onRelease, releasing }: EscrowCardProps) {
  const counterparty = role === "seller" ? escrow.buyer_email : escrow.seller_email;
  const isReleasing = releasing === escrow.escrow_id;

  return (
    <GlassCard className="p-5 space-y-4" glowOnHover accentColor="cyan">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {escrow.description || `Escrow #${escrow.escrow_id}`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === "seller" ? "Buyer:" : "Seller:"}{" "}
            <span className="text-slate-400">{counterparty}</span>
          </p>
        </div>
        <StatusBadge status={escrow.status} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-white">${escrow.amount_fiat.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{formatDate(escrow.created_at)}</p>
        </div>
        {escrow.arbitration_enabled && (
          <span className="text-xs text-purple-400 flex items-center gap-1">
            🤖 AI Protected
          </span>
        )}
      </div>

      {/* Seller actions */}
      {role === "seller" && escrow.status === "FUNDED" && escrow.contract_address && (
        <GlowButton
          onClick={() => onRelease(escrow)}
          loading={isReleasing}
          disabled={isReleasing}
          className="w-full !bg-green-500 !text-black hover:!bg-green-400 !shadow-[0_0_20px_rgba(74,222,128,0.35)]"
        >
          {isReleasing ? "Releasing..." : "Release Funds to Me →"}
        </GlowButton>
      )}

      {/* Seller waiting */}
      {role === "seller" && escrow.status === "PENDING_PAYMENT" && (
        <p className="text-xs text-slate-500 text-center">
          Waiting for buyer to complete payment…
        </p>
      )}

      {/* Buyer actions */}
      {role === "buyer" && escrow.status === "PENDING_PAYMENT" && (
        <Link href={`/marketplace/escrow/${escrow.escrow_id}`}>
          <GlowButton className="w-full">Complete Payment →</GlowButton>
        </Link>
      )}
    </GlassCard>
  );
}

export default function MarketplaceDashboard() {
  const { ready, authenticated, login, user, walletAddress, walletProvider } = usePrivy();
  const { addToast } = useToast();

  const [sellingEscrows, setSellingEscrows] = useState<MarketplaceEscrow[]>([]);
  const [buyingEscrows, setBuyingEscrows] = useState<MarketplaceEscrow[]>([]);
  const [loadingEscrows, setLoadingEscrows] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);

  const userEmail = user?.email ?? "";

  const [releasingEscrowId, setReleasingEscrowId] = useState<string | null>(null);

  // Fetch escrows from Supabase
  useEffect(() => {
    if (!authenticated || !userEmail) return;
    setLoadingEscrows(true);

    const fetchEscrows = async () => {
      const res = await fetch("/api/marketplace/my-escrows?email=" + encodeURIComponent(userEmail));
      const data = await res.json();
      setSellingEscrows((data.selling as MarketplaceEscrow[]) ?? []);
      setBuyingEscrows((data.buying as MarketplaceEscrow[]) ?? []);
      setLoadingEscrows(false);
    };

    fetchEscrows();
  }, [authenticated, userEmail]);



  async function handleRelease(escrow: MarketplaceEscrow) {
    if (!escrow.contract_address) {
      addToast({ type: "error", message: "No contract address found for this escrow." });
      return;
    }
    setReleasing(escrow.escrow_id);
    setReleasingEscrowId(escrow.escrow_id);
    try {
      await writeRelease({
        address: escrow.contract_address as `0x${string}`,
        abi: SimpleEscrowABI,
        functionName: "release",
        chainId: 8453,
      });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Transaction failed" });
      setReleasing(null);
      setReleasingEscrowId(null);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
        <AnimatedBackground />
        <MarketplaceNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      <AnimatedBackground />
      <MarketplaceNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Marketplace Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your escrow transactions</p>
          </div>
          {authenticated && (
            <Link href="/marketplace">
              <GlowButton variant="secondary">+ New Escrow</GlowButton>
            </Link>
          )}
        </div>

        {/* Login gate */}
        {!authenticated && (
          <GlassCard className="p-10 text-center space-y-5">
            <div className="text-4xl">🔐</div>
            <h2 className="text-lg font-semibold">Sign in to view your escrows</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Access all your active and completed marketplace escrow transactions.
            </p>
            <GlowButton onClick={login} className="w-full max-w-xs mx-auto block">
              Continue with Email →
            </GlowButton>
          </GlassCard>
        )}

        {/* Loading */}
        {authenticated && loadingEscrows && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        {authenticated && !loadingEscrows && (
          <div className="space-y-10">
            {/* Selling section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">📤</span>
                You are selling
                {sellingEscrows.length > 0 && (
                  <span className="text-xs text-slate-500 font-normal">
                    ({sellingEscrows.length})
                  </span>
                )}
              </h2>
              {sellingEscrows.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No selling escrows yet.</p>
                  <Link href="/marketplace" className="inline-block mt-3">
                    <GlowButton variant="secondary" className="text-xs">
                      Create your first escrow →
                    </GlowButton>
                  </Link>
                </GlassCard>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sellingEscrows.map((e) => (
                    <EscrowCard
                      key={e.escrow_id}
                      escrow={e}
                      role="seller"
                      userEmail={userEmail}
                      onRelease={handleRelease}
                      releasing={releasing}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Buying section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">📥</span>
                You are buying
                {buyingEscrows.length > 0 && (
                  <span className="text-xs text-slate-500 font-normal">
                    ({buyingEscrows.length})
                  </span>
                )}
              </h2>
              {buyingEscrows.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">
                    No buying escrows yet. Ask a seller to create one for you.
                  </p>
                </GlassCard>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {buyingEscrows.map((e) => (
                    <EscrowCard
                      key={e.escrow_id}
                      escrow={e}
                      role="buyer"
                      userEmail={userEmail}
                      onRelease={handleRelease}
                      releasing={releasing}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
