"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { GoogleSignInButton } from "@/components/google-signin";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { WalletQR } from "@/components/wallet-qr";
import { useActiveWallet } from "@/hooks/useActiveWallet";

const STATE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING_PAYMENT: { label: "Awaiting Payment", color: "text-amber-400", emoji: "⏳" },
  FUNDED:          { label: "Paid — In Progress", color: "text-[#35D07F]", emoji: "🔒" },
  RELEASED:        { label: "Job Complete", color: "text-blue-400", emoji: "✅" },
  DISPUTED:        { label: "In Dispute", color: "text-red-400", emoji: "⚖️" },
  REFUNDED:        { label: "Refunded", color: "text-red-400", emoji: "↩️" },
};

type PaymentItem = {
  id: string;
  escrow_id: string;
  contract_address: string | null;
  on_chain_escrow_id: string | null;
  description: string | null;
  amount_usdc: number;
  amount_fiat: number | null;
  currency: string | null;
  status: string;
  buyer_wallet: string | null;
  seller_wallet: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const { address: activeAddress } = useActiveWallet();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      if (!session || !activeAddress) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/my-escrows?wallet=${activeAddress}`);
        const json = await res.json();
        if (json.success) {
          setPayments(json.escrows);
        }
      } catch {
        showToast("Failed to load payments", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [session, activeAddress, showToast]);

  if (!session) {
    return (
      <main className="flex flex-col min-h-screen">
        <MarketplaceNav />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-2">My Payments</h1>
            <p className="text-white/60 mb-8">
              Track and manage your payment requests.
            </p>
            <GlassCard className="py-8">
              <p className="text-white/70 mb-4">Sign in to view your payments</p>
              <GoogleSignInButton />
            </GlassCard>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <MarketplaceNav />
      <div className="flex-1 px-5 py-12 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white mb-2">My Payments</h1>
        <p className="text-white/60 mb-8">
          Track and manage your payment requests and deliveries.
        </p>

        {/* Wallet Card */}
        <div className="mb-8 max-w-md">
          <WalletQR
            address={activeAddress}
            balanceUsdt="0.00"
            balanceCelo="0"
          />
        </div>

        {loading && (
          <GlassCard className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading...</p>
          </GlassCard>
        )}

        {!loading && payments.length === 0 && (
          <GlassCard className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white/70 mb-4">No payments yet</p>
            <Link href="/create" className="text-[#4A9EFF] text-sm">
              Request your first payment →
            </Link>
          </GlassCard>
        )}

        {!loading && payments.length > 0 && (
          <div className="flex flex-col gap-4">
            {payments.map((payment) => {
              const state = STATE_LABELS[payment.status] ?? STATE_LABELS.PENDING_PAYMENT;
              const isFreelancer = activeAddress?.toLowerCase() === payment.seller_wallet?.toLowerCase();
              const isClient = activeAddress?.toLowerCase() === payment.buyer_wallet?.toLowerCase();

              return (
                <GlassCard key={payment.escrow_id} className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        {payment.description || "Payment " + payment.escrow_id.slice(0, 8)}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${state.color}`}>
                      {state.emoji} {state.label}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Amount</span>
                    <span className="text-white font-semibold">${(payment.amount_usdc ?? 0).toFixed(2)} USDT</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Your Role</span>
                    <span className="text-white/70">
                      {isFreelancer ? "Freelancer" : isClient ? "Client" : "Observer"}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {payment.contract_address && (
                      <Link
                        href={`/escrow/${payment.contract_address}`}
                        className="flex-1 text-center bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        View Details
                      </Link>
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
