"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";

const STATE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING_PAYMENT: { label: "Awaiting Deposit", color: "text-amber-400", emoji: "⏳" },
  FUNDED:          { label: "Funded",          color: "text-green-400", emoji: "🔒" },
  RELEASED:        { label: "Released",        color: "text-blue-400",  emoji: "✅" },
  DISPUTED:        { label: "Disputed",        color: "text-red-400",   emoji: "⚖️" },
  REFUNDED:        { label: "Refunded",        color: "text-red-400",   emoji: "↩️" },
};

type Listing = {
  escrow_id: string;
  contract_address: string | null;
  description: string | null;
  amount_usdc: number;
  amount_fiat: number | null;
  currency: string | null;
  seller_wallet: string | null;
  created_at: string;
  status: string;
};

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const { showToast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch("/api/listings?limit=20");
        const json = await res.json();
        if (json.success) {
          setListings(json.listings);
        }
      } catch {
        showToast("Failed to load listings", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [showToast]);

  const filtered = search
    ? listings.filter((l) =>
        (l.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />

      {/* Hero */}
      <section className="relative px-5 pt-12 pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#35D07F]/30 bg-[#35D07F]/10 px-4 py-1.5 text-xs font-medium text-[#35D07F] mb-5">
            ⚡ Powered by EscrowHubs
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            NaijaLancers
          </h1>
          <p className="text-lg text-white/60 mb-2 max-w-md mx-auto">
            Buy and sell safely with on-chain escrow.
          </p>
          <p className="text-sm text-white/40 mb-8 max-w-sm mx-auto">
            Funds locked in cUSD on Celo until delivery is confirmed. No chargebacks, no middlemen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/create">
                <GlowButton variant="primary" className="min-w-[200px]">
                  Create Escrow →
                </GlowButton>
              </Link>
            <Link href="/dashboard">
              <GlowButton variant="secondary" className="min-w-[200px]">
                My Escrows
              </GlowButton>
            </Link>
          </div>

          {!isConnected && (
            <p className="text-xs text-white/30 mt-3">
              Connect your MiniPay wallet to create or fund escrows.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "📝",
                step: "1",
                title: "Create Escrow",
                desc: "Seller describes the deal and locks cUSD in a smart contract.",
              },
              {
                icon: "💰",
                step: "2",
                title: "Buyer Funds",
                desc: "Buyer receives a link and deposits cUSD via MiniPay. Funds are locked on-chain.",
              },
              {
                icon: "🤝",
                step: "3",
                title: "Confirm & Release",
                desc: "Seller delivers, buyer confirms. Funds released instantly to the seller's wallet.",
              },
            ].map((s) => (
              <GlassCard key={s.step} className="p-5 text-center" accentColor="green">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-xs font-bold text-[#35D07F] mb-1">Step {s.step}</div>
                <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{s.desc}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="px-5 pb-16 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Open Escrows</h2>
              <p className="text-sm text-white/50">
                Browse deals waiting for a buyer. Fund with cUSD from your MiniPay wallet.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#35D07F]/50 focus:outline-none focus:ring-1 focus:ring-[#35D07F]/30"
              />
            </div>
          </div>

          {loading && (
            <GlassCard className="text-center py-12" accentColor="green">
              <div className="w-8 h-8 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">Loading open escrows...</p>
            </GlassCard>
          )}

          {!loading && filtered.length === 0 && (
            <GlassCard className="text-center py-12" accentColor="green">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-white/70 mb-2">No open escrows found</p>
              <p className="text-white/40 text-sm mb-4">
                {search ? "Try a different search term." : "Be the first to create an escrow."}
              </p>
              <Link href="/create">
                <GlowButton variant="primary" className="mx-auto">Create Escrow</GlowButton>
              </Link>
            </GlassCard>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((listing) => {
                const state = STATE_LABELS[listing.status] ?? STATE_LABELS.PENDING_PAYMENT;
                return (
                  <GlassCard key={listing.escrow_id} className="p-5 flex flex-col gap-3" accentColor="green">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {listing.description || "Untitled escrow"}
                        </p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${state.color}`}>
                        {state.emoji} {state.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/50">Amount</span>
                      <span className="text-white font-semibold">
                        {listing.amount_usdc.toFixed(2)} {listing.currency ?? "cUSD"}
                      </span>
                    </div>

                    {listing.seller_wallet && (
                      <div className="text-xs text-white/30 font-mono truncate">
                        Seller: {listing.seller_wallet.slice(0, 10)}…{listing.seller_wallet.slice(-4)}
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      {listing.contract_address ? (
                        <Link
                          href={`/escrow/${listing.contract_address}`}
                          className="flex-1 text-center bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                        >
                          View Details
                        </Link>
                      ) : (
                        <span className="flex-1 text-center text-xs text-white/30 py-2">
                          Contract pending
                        </span>
                      )}
                      <Link href={`/escrow/${listing.contract_address ?? ""}`} className="flex-1">
                        <GlowButton variant="primary" className="w-full text-sm">
                          Fund Escrow
                        </GlowButton>
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: "🔐",
              title: "Funds Locked On-Chain",
              desc: "Smart contracts hold cUSD — neither party can withdraw unilaterally.",
            },
            {
              icon: "📱",
              title: "MiniPay Native",
              desc: "Works inside Opera MiniPay. No external apps needed.",
            },
            {
              icon: "⚡",
              title: "Instant Settlement",
              desc: "Release funds in seconds once delivery is confirmed.",
            },
            {
              icon: "🌍",
              title: "Built for Africa",
              desc: "Celo infrastructure with low fees. On-ramp coming soon via Pretium / P2P.",
            },
          ].map((v) => (
            <GlassCard key={v.title} className="p-5" accentColor="green">
              <div className="text-2xl mb-2">{v.icon}</div>
              <p className="text-sm font-semibold text-white mb-1">{v.title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{v.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
