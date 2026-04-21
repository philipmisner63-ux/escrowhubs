"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";

const PROTOCOL_FEE_BPS = 50;

function calcFees(amount: string) {
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return null;
  const protocolFee = +(n * (PROTOCOL_FEE_BPS / 10000)).toFixed(4);
  const total = +(n + protocolFee).toFixed(4);
  return { protocolFee, total };
}

export default function MarketplacePage() {
  const [buyerContact, setBuyerContact] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [useAIArbiter, setUseAIArbiter] = useState(true);

  const fees = calcFees(amount);

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <AnimatedBackground />
      <Nav />

      {/* Coming Soon Banner */}
      <div className="relative z-10 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-b border-yellow-400/30 px-4 py-3 text-center">
        <p className="text-sm font-medium text-yellow-300">
          🚧 <strong>BlockDAG Marketplace — Coming Soon</strong> — This preview shows the upcoming P2P commerce experience powered by BlockDAG. Final version includes fiat on/off-ramp and full BDAG settlement.
        </p>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300 mb-4">
            ⚡ Powered by BlockDAG
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            EscrowHubs Marketplace
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Sell anything to anyone, anywhere. Funds locked on-chain until delivery is confirmed — no banks, no chargebacks, no middlemen.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "📋", step: "1", title: "Create Escrow", desc: "Set amount, describe the deal, enter buyer contact" },
            { icon: "🔒", step: "2", title: "Buyer Pays", desc: "Buyer receives link, pays in BDAG — funds locked on-chain" },
            { icon: "✅", step: "3", title: "Confirm & Release", desc: "You confirm delivery, funds released to your wallet" },
          ].map(s => (
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
            <span className="ml-auto text-xs text-slate-500">Seller</span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">What are you selling?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Custom logo design, vintage guitar, freelance dev work..."
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 resize-none"
            />
          </div>

          {/* Buyer contact */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Buyer Email or Phone</label>
            <input
              type="text"
              value={buyerContact}
              onChange={e => setBuyerContact(e.target.value)}
              placeholder="buyer@email.com or +1 555 000 0000"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />
            <p className="text-xs text-slate-600">They&apos;ll receive a secure payment link — no crypto wallet required to pay.</p>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Amount (BDAG)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>

          {/* Arbitration */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Dispute Resolution</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseAIArbiter(false)}
                className={`rounded-xl border p-3 text-left transition-all ${!useAIArbiter ? "border-cyan-400/40 bg-cyan-400/5" : "border-white/10 bg-white/5 hover:border-white/20"}`}
              >
                <div className="text-lg mb-1">👤</div>
                <p className="text-xs font-semibold text-white">Human Review</p>
                <p className="text-xs text-slate-500 mt-0.5">EscrowHubs team resolves disputes</p>
              </button>
              <button
                type="button"
                onClick={() => setUseAIArbiter(true)}
                className={`rounded-xl border p-3 text-left transition-all ${useAIArbiter ? "border-violet-400/40 bg-violet-400/5" : "border-white/10 bg-white/5 hover:border-white/20"}`}
              >
                <div className="text-lg mb-1">🤖</div>
                <p className="text-xs font-semibold text-white">AI Arbiter</p>
                <p className="text-xs text-slate-500 mt-0.5">Automated dispute resolution</p>
              </button>
            </div>
          </div>

          {/* Fee breakdown */}
          {fees && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
              <p className="font-medium text-slate-400 uppercase tracking-widest">Fee Breakdown</p>
              <div className="flex justify-between text-slate-300">
                <span>Escrow amount</span>
                <span>{parseFloat(amount).toFixed(2)} BDAG</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Protocol fee (0.5%)</span>
                <span>{fees.protocolFee} BDAG</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2 mt-1">
                <span>Buyer pays total</span>
                <span>{fees.total} BDAG</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <GlowButton
              type="button"
              onClick={() => alert("Coming soon — BlockDAG Marketplace launches shortly. Sign up to be notified.")}
              className="w-full"
            >
              Create Escrow & Notify Buyer →
            </GlowButton>
            <p className="text-center text-xs text-slate-600 mt-2">
              Buyer pays in BDAG · Funds locked on-chain · Released on your confirmation
            </p>
          </div>
        </GlassCard>

        {/* Value props */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            { icon: "⚡", title: "No Wallet Required", desc: "Buyers pay via credit card or debit card — onramp handled automatically" },
            { icon: "🔐", title: "Funds Locked On-Chain", desc: "Smart contracts hold funds — neither party can withdraw unilaterally" },
            { icon: "🤖", title: "AI Dispute Resolution", desc: "Evidence reviewed by AI oracle — binding decision in 48 hours" },
            { icon: "🌐", title: "Sell to Anyone", desc: "No geographic restrictions — works for Facebook Marketplace, freelance, DAO work" },
          ].map(v => (
            <GlassCard key={v.title} className="p-4">
              <div className="text-xl mb-2">{v.icon}</div>
              <p className="text-xs font-semibold text-white mb-1">{v.title}</p>
              <p className="text-xs text-slate-500">{v.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Waitlist CTA */}
        <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-violet-400/5 p-6 text-center">
          <p className="text-lg font-bold text-white mb-1">Be First on BlockDAG Marketplace</p>
          <p className="text-sm text-slate-400 mb-4">Get early access when we launch. No crypto required to buy or sell.</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none"
            />
            <GlowButton
              type="button"
              onClick={() => alert("Thanks! We'll notify you at launch.")}
              className="px-4 py-2.5 text-sm whitespace-nowrap"
            >
              Notify Me
            </GlowButton>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
