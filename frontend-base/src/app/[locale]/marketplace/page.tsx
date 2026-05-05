"use client";

import { useState } from "react";
import { usePrivy } from "@/components/privy-provider";
import { Link } from "@/i18n/navigation";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";

const PROTOCOL_FEE_BPS = 50;
const AI_ARBITER_FEE_USD = 1.0;

function calcFees(amount: string, useArbiter: boolean) {
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return null;
  const protocolFee = +(n * (PROTOCOL_FEE_BPS / 10000)).toFixed(4);
  const arbiterFee = useArbiter ? AI_ARBITER_FEE_USD : 0;
  const total = +(n + protocolFee + arbiterFee).toFixed(4);
  return { protocolFee, arbiterFee, total };
}

export default function MarketplacePage() {
  const { addToast } = useToast();
  const { ready, authenticated, login, user, walletAddress } = usePrivy();

  const [buyerContact, setBuyerContact] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [useAIArbiter, setUseAIArbiter] = useState(true);
  const [loading, setLoading] = useState(false);

  const [successState, setSuccessState] = useState<{
    escrow_id: string;
    escrow_url: string;
    buyer_notified_by: string;
  } | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const sellerEmail = user?.email ?? user?.phone ?? "";
  const fees = calcFees(amount, useAIArbiter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerEmail) {
      addToast({ type: "error", message: "Could not read your identity. Please log in again." });
      return;
    }
    if (!buyerContact || !amount) {
      addToast({ type: "error", message: "Please fill in all required fields." });
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) {
      addToast({ type: "error", message: "Amount must be at least $1." });
      return;
    }
    if (buyerContact.toLowerCase() === sellerEmail.toLowerCase()) {
      addToast({ type: "error", message: "Buyer and seller contact must be different." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/create-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_contact: sellerEmail,
          seller_wallet: walletAddress,
          buyer_contact: buyerContact,
          amount_fiat: amt,
          description,
          arbitration_enabled: useAIArbiter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create escrow");
      setSuccessState({
        escrow_id: data.escrow_id,
        escrow_url: data.escrow_url,
        buyer_notified_by: data.buyer_notified_by ?? "email",
      });
      addToast({ type: "success", message: "Escrow created! Email sent to buyer." });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyUrl() {
    if (!successState) return;
    navigator.clipboard.writeText(successState.escrow_url).then(() => {
      setUrlCopied(true);
      addToast({ type: "success", message: "Link copied!" });
      setTimeout(() => setUrlCopied(false), 3000);
    });
  }

  function handleReset() {
    setSuccessState(null);
    setBuyerContact("");
    setAmount("");
    setDescription("");
    setUseAIArbiter(true);
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Success state */}
        {successState ? (
          <GlassCard className="p-10 text-center space-y-6">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-white">Escrow Created!</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {successState.buyer_notified_by === "link_only"
                ? "Share the payment link below with your buyer."
                : "Your buyer has been emailed the payment link."}
            </p>

            <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">What happens next</p>
              <ol className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">1.</span>
                  <span>
                    {successState.buyer_notified_by === "link_only"
                      ? "Send the link below to your buyer so they can complete payment."
                      : "Your buyer receives the email and clicks the payment link — no action needed from you yet."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">2.</span>
                  <span>Your buyer verifies their identity and funds the escrow with USDC.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">3.</span>
                  <span>You deliver the goods or service as agreed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">4.</span>
                  <span>
                    Go to your <strong className="text-white">Dashboard</strong> and release the funds once delivery is confirmed.
                  </span>
                </li>
              </ol>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-xs text-slate-400 font-medium">Share this link with your buyer:</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-300 font-mono flex-1 truncate">
                  {successState.escrow_url}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className={`text-xs px-3 py-1.5 rounded-lg flex-shrink-0 font-medium transition-colors ${
                    urlCopied
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                  }`}
                >
                  {urlCopied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/marketplace/dashboard">
                <GlowButton className="w-full">View Dashboard →</GlowButton>
              </Link>
              <button
                onClick={handleReset}
                className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
              >
                Create another escrow
              </button>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300 mb-4">
                ⚡ Powered by Base
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">EscrowHubs Marketplace</h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Sell anything to anyone, anywhere. Funds locked on-chain until delivery is confirmed — no banks, no chargebacks, no middlemen.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: "📋", step: "1", title: "Create Escrow", desc: "Set amount, describe the deal, enter buyer contact" },
                { icon: "💳", step: "2", title: "Buyer Pays", desc: "Buyer receives link, pays in USDC via card or crypto — funds locked on-chain" },
                { icon: "✅", step: "3", title: "Confirm & Release", desc: "You confirm delivery, funds released to your wallet" },
              ].map((s) => (
                <GlassCard key={s.step} className="p-4 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-xs font-bold text-cyan-400 mb-1">Step {s.step}</div>
                  <div className="text-xs font-semibold text-white mb-1">{s.title}</div>
                  <div className="text-xs text-slate-500">{s.desc}</div>
                </GlassCard>
              ))}
            </div>

            {/* Form */}
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <span className="text-lg">🛍️</span>
                <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Create Escrow</h2>
                <span className="ml-auto text-xs text-slate-500">
                  {authenticated && sellerEmail ? `Selling as: ${sellerEmail}` : "Seller"}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    What are you selling?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Custom logo design, vintage guitar, freelance dev work..."
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 resize-none"
                  />
                </div>

                {/* Buyer contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    Buyer Email or Phone
                  </label>
                  <input
                    type="text"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="buyer@email.com or +1 555 000 0000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  />
                  <p className="text-xs text-slate-600">
                    They&apos;ll receive a secure payment link — no crypto wallet required to pay.
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  />
                </div>

                {/* Dispute resolution */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    Dispute Resolution
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUseAIArbiter(false)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        !useAIArbiter
                          ? "border-cyan-400/40 bg-cyan-400/5"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-lg mb-1">👤</div>
                      <p className="text-xs font-semibold text-white">Human Review</p>
                      <p className="text-xs text-slate-500 mt-0.5">EscrowHubs team resolves disputes</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAIArbiter(true)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        useAIArbiter
                          ? "border-violet-400/40 bg-violet-400/5"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-lg mb-1">🤖</div>
                      <p className="text-xs font-semibold text-white">AI Arbiter</p>
                      <p className="text-xs text-slate-500 mt-0.5">Automated dispute resolution (~$1 flat fee)</p>
                    </button>
                  </div>
                </div>

                {/* Fee breakdown */}
                {fees && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
                    <p className="font-medium text-slate-400 uppercase tracking-widest">Fee Breakdown</p>
                    <div className="flex justify-between text-slate-300">
                      <span>Escrow amount</span>
                      <span>{parseFloat(amount).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Protocol fee (0.5%)</span>
                      <span>{fees.protocolFee.toFixed(2)} USDC</span>
                    </div>
                    {useAIArbiter && (
                      <div className="flex justify-between text-slate-400">
                        <span>AI arbiter fee</span>
                        <span>~{fees.arbiterFee.toFixed(2)} USDC</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2 mt-1">
                      <span>Buyer pays total</span>
                      <span>{fees.total.toFixed(2)} USDC</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-1">
                  {authenticated ? (
                    <GlowButton
                      type="submit"
                      loading={loading}
                      disabled={loading || !buyerContact || !amount}
                      className="w-full"
                    >
                      {loading ? "Creating Escrow..." : "Create Escrow & Notify Buyer →"}
                    </GlowButton>
                  ) : (
                    <GlowButton type="button" onClick={login} className="w-full">
                      Sign In to Create Escrow →
                    </GlowButton>
                  )}
                  <p className="text-center text-xs text-slate-600 mt-2">
                    Buyer pays in USDC · Funds locked on-chain · Released on your confirmation
                  </p>
                </div>
              </form>
            </GlassCard>

            {/* Value props */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: "⚡", title: "No Wallet Required", desc: "Buyers pay via credit card or debit card — onramp handled automatically" },
                { icon: "🔐", title: "Funds Locked On-Chain", desc: "Smart contracts hold funds — neither party can withdraw unilaterally" },
                { icon: "🤖", title: "AI Dispute Resolution", desc: "Evidence reviewed by AI oracle — binding decision in 48 hours" },
                { icon: "🌐", title: "Sell to Anyone", desc: "No geographic restrictions — works for Facebook Marketplace, freelance, DAO work" },
              ].map((v) => (
                <GlassCard key={v.title} className="p-4">
                  <div className="text-xl mb-2">{v.icon}</div>
                  <p className="text-xs font-semibold text-white mb-1">{v.title}</p>
                  <p className="text-xs text-slate-500">{v.desc}</p>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
