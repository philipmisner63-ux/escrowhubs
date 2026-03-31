"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Simple Escrow",
    desc: "Single-release escrow between two parties. Funds held until delivery confirmed by depositor or resolved by arbiter.",
    accent: "cyan" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="4" rx="1" />
        <rect x="2" y="10" width="20" height="4" rx="1" />
        <rect x="2" y="17" width="20" height="4" rx="1" />
      </svg>
    ),
    title: "Milestone Payments",
    desc: "Break projects into phases. Release funds milestone by milestone with full dispute protection at every stage.",
    accent: "purple" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Adaptive Security",
    desc: "Verification intensity scales with transaction size and trust history. High-value contracts get deeper scrutiny.",
    accent: "blue" as const,
  },
];

const aiSteps = [
  {
    step: "01",
    title: "Dispute raised",
    desc: "Either party marks the escrow as disputed on-chain.",
  },
  {
    step: "02",
    title: "Evidence submitted",
    desc: "Both parties submit evidence — IPFS links, text, or URLs — directly to the blockchain.",
  },
  {
    step: "03",
    title: "AI reviews",
    desc: "Our oracle fetches all evidence and sends it to an AI model for impartial analysis.",
  },
  {
    step: "04",
    title: "Automatic resolution",
    desc: "The AI decision is signed and executed on-chain. Funds released or refunded in minutes, not weeks.",
  },
];

const stats = [
  { value: "0.5%", label: "Protocol Fee"    },
  { value: "1404", label: "Chain ID"         },
  { value: "0",    label: "Exploits"         },
  { value: "100%", label: "On-Chain"         },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Featured on BlockDAG Academy
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-white block">Trustless Escrow</span>
            <span
              className="block mt-1"
              style={{ color: "#00f5ff", textShadow: "0 0 40px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)" }}
            >
              on BlockDAG
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Secure milestone-based payments powered by smart contracts.
            AI-driven dispute resolution. No middlemen, no trust required.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard">
              <GlowButton variant="primary" className="px-8 py-3 text-base">
                Launch App →
              </GlowButton>
            </Link>
            <a
              href="https://github.com/philipmisner63-ux/blockdag-escrow"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GlowButton variant="secondary" className="px-8 py-3 text-base">
                View Contracts
              </GlowButton>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map(f => (
              <GlassCard key={f.title} accentColor={f.accent} className="p-6">
                <div
                  className="mb-4"
                  style={{
                    color: f.accent === "cyan" ? "#00f5ff" : f.accent === "purple" ? "#a855f7" : "#3b82f6",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-white text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Arbiter section */}
      <section className="border-t border-white/8 py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300 mb-4">
                🤖 Powered by AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Disputes Resolved by AI,{" "}
                <span style={{ color: "#a855f7", textShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
                  Not Lawyers
                </span>
              </h2>
              <p className="mt-4 text-slate-400 max-w-xl mx-auto">
                Select AI Arbiter when creating an escrow. If a dispute arises, both parties
                submit evidence on-chain — our AI oracle reviews it and executes the ruling
                automatically. No waiting, no bias, no fees to a third party.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiSteps.map((s, i) => (
                <div key={s.step} className="relative">
                  {i < aiSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-violet-400/30 to-transparent z-10" />
                  )}
                  <GlassCard accentColor="purple" className="p-5 h-full">
                    <p className="text-3xl font-bold font-mono mb-3"
                      style={{ color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
                      {s.step}
                    </p>
                    <p className="font-semibold text-white text-sm mb-1">{s.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </GlassCard>
                </div>
              ))}
            </div>

            {/* Pricing callout */}
            <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">AI Arbiter Pricing</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  0.5% protocol fee on all escrows · +1 BDAG flat fee when AI Arbiter is selected
                </p>
              </div>
              <Link href="/create">
                <GlowButton variant="primary" className="shrink-0">
                  Create Escrow →
                </GlowButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/8 py-16 px-4">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map(s => (
              <div key={s.label}>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: "var(--font-mono)", color: "#00f5ff", textShadow: "0 0 20px rgba(0,245,255,0.4)" }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 text-center text-xs text-slate-600">
        Built on BlockDAG · Featured on BlockDAG Academy ·{" "}
        <a
          href="https://github.com/philipmisner63-ux/blockdag-escrow"
          className="hover:text-cyan-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
