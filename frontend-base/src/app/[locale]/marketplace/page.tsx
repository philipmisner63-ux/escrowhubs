"use client";

import { useState } from "react";
import { usePrivy } from "@/components/privy-provider";
import { Link } from "@/i18n/navigation";
import { Nav } from "@/components/nav";
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
      addToast({ type: "error", message: "Buyer and seller email must be different." });
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
      setSuccessState({ escrow_id: data.escrow_id, escrow_url: data.escrow_url, buyer_notified_by: data.buyer_notified_by ?? "email" });
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
    setBuyerEmail("");
    setAmount("");
    setDescription("");
    setUseAIArbiter(true);
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
        <AnimatedBackground />
        <Nav />
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
      <Nav />

      <div className="bg-yellow-500/20 border-b border-yellow-500/40 px-4 py-2 text-center text-yellow-300 text-sm font-medium">⚠️ Test Mode — Marketplace is under development and not yet open to the public</div><main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            Marketplace Mode
          </span>
          <h1 className="text-3xl font-bold mb-3">Create Protected Escrow</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Send a payment request to your buyer. Funds are locked on-chain until
            you deliver — no disputes, no chargebacks.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
          {[
            { icon: "🔒", label: "Funds locked on-chain" },
            { icon: "🤖", label: "AI dispute arbiter" },
            { icon: "⚡", label: "Instant setup" },
            { icon: "🌍", label: "Global payments" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-xs text-slate-400">
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Login gate */}
        {!authenticated && (
          <GlassCard className="p-8 text-center space-y-5">
            <div className="text-4xl">🔐</div>
            <h2 className="text-lg font-semibold text-white">Login to create an escrow</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Sign in with your email or phone number to create a protected payment request for your buyer.
            </p>
            <GlowButton onClick={login} className="w-full">
              Continue with Email or Phone →
            </GlowButton>
            <p className="text-xs text-slate-600">
              A secure wallet is created automatically — no seed phrases needed.
            </p>
          </GlassCard>
        )}

        {/* Success state */}
        {authenticated && successState && (
          <GlassCard className="p-10 text-center space-y-6">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-white">Escrow Created!</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {successState.buyer_notified_by === "link_only"
                ? "Share the link below directly with your buyer."
                : "An email has been sent to your buyer with the payment link. Once they fund the escrow, you will be notified."}
            </p>

            {/* Escrow URL */}
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
                <GlowButton className="w-full">
                  View Dashboard →
                </GlowButton>
              </Link>
              <button
                onClick={handleReset}
                className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
              >
                Create another escrow
              </button>
            </div>
          </GlassCard>
        )}

        {/* Creation form */}
        {authenticated && !successState && (
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Escrow Details</h2>
              <span className="text-xs text-slate-500">
                Selling as: <span className="text-slate-300">{sellerEmail}</span>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Buyer email */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Buyer Email or Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="buyer@example.com or +1 234 567 8900"
                  value={buyerContact}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1">
                  A secure wallet will be created for the buyer automatically.
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Amount (USD) <span className="text-red-400">*</span>{" "}
                  <span className="text-slate-600">(minimum $1)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Fee breakdown */}
                {fees && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-white/3 border border-white/8 space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Escrow amount</span>
                      <span>${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Protocol fee (0.5%)</span>
                      <span>${fees.protocolFee.toFixed(2)}</span>
                    </div>
                    {useAIArbiter && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>AI Arbiter fee</span>
                        <span>~${fees.arbiterFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-white font-semibold border-t border-white/10 pt-1 mt-1">
                      <span>Total buyer pays</span>
                      <span>${fees.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Description <span className="text-slate-600">(optional)</span>
                </label>
                <textarea
                  placeholder="Describe what you're selling or the terms of the deal..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>

              {/* AI Arbiter toggle */}
              <div className="px-4 py-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="text-sm font-medium text-white">AI Dispute Protection</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        If there&apos;s a disagreement, AI reviews evidence and rules within 48h.
                        {useAIArbiter ? " ~$1 flat fee added." : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseAIArbiter((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      useAIArbiter ? "bg-purple-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        useAIArbiter ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {!useAIArbiter && (
                  <p className="text-xs text-yellow-400/70 mt-2">
                    ⚠️ Without AI arbitration, disputes require manual resolution.
                  </p>
                )}
              </div>

              <GlowButton
                type="submit"
                loading={loading}
                disabled={loading || !buyerContact || !amount}
                className="w-full"
              >
                {loading ? "Creating Escrow..." : "Create Protected Escrow →"}
              </GlowButton>

              <p className="text-center text-xs text-slate-600">
                0.5% protocol fee · Buyer email notification sent instantly · Funds locked until delivery
              </p>
            </form>
          </GlassCard>
        )}

        {/* How it works */}
        {!successState && (
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { n: "1", title: "Create escrow", desc: "Set amount and buyer email" },
              { n: "2", title: "Buyer pays", desc: "They fund via card or crypto" },
              { n: "3", title: "You get paid", desc: "Release on delivery confirmation" },
            ].map((item) => (
              <div key={item.n} className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center mx-auto">
                  {item.n}
                </div>
                <p className="text-xs font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
