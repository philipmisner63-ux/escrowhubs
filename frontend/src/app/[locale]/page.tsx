"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";

const features = [
  {
    icon: "🛡️",
    title: "Simple Escrow",
    desc: "Single-release escrow between two parties. Funds held until delivery confirmed by depositor or resolved by arbiter.",
    accent: "border-cyan-400/20 bg-cyan-400/5 text-cyan-400",
  },
  {
    icon: "◈",
    title: "Milestone Payments",
    desc: "Break projects into phases. Release funds milestone by milestone with full dispute protection at every stage.",
    accent: "border-purple-400/20 bg-purple-400/5 text-purple-400",
  },
  {
    icon: "⚡",
    title: "Adaptive Security",
    desc: "Verification intensity scales with transaction size and trust history. High-value contracts get deeper scrutiny.",
    accent: "border-blue-400/20 bg-blue-400/5 text-blue-400",
  },
];

const aiSteps = [
  { step: "01", title: "Dispute raised",       desc: "Either party marks the escrow as disputed on-chain." },
  { step: "02", title: "Evidence submitted",   desc: "Both parties submit evidence — IPFS links, text, or URLs — directly to the blockchain." },
  { step: "03", title: "AI reviews",           desc: "Our oracle fetches all evidence and sends it to an AI model for impartial analysis." },
  { step: "04", title: "Automatic resolution", desc: "The AI decision is signed and executed on-chain. Funds released or refunded in minutes." },
];

const stats = [
  { value: "0.5%", label: "Protocol Fee" },
  { value: "1404", label: "Chain ID"     },
  { value: "0",    label: "Exploits"     },
  { value: "100%", label: "On-Chain"     },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/8 bg-gradient-to-b from-[#080a10] to-[#060608] px-6 py-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Featured on BlockDAG Academy
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight"
          >
            <span className="text-white block">Trustless Escrow</span>
            <span className="block mt-1 text-cyan-400" style={{ textShadow: "0 0 40px rgba(0,245,255,0.5)" }}>
              on BlockDAG
            </span>
          </motion.h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            Secure milestone-based payments powered by smart contracts.
            AI-driven dispute resolution. No middlemen, no trust required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link href="/dashboard" className="px-8 py-3 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/20 transition-all">
              Launch App →
            </Link>
            <a href="https://github.com/philipmisner63-ux/blockdag-escrow" target="_blank" rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/8 transition-all">
              View Contracts
            </a>
          </div>
        </section>

        {/* ── Welcome Card + Quick Actions ─────────────────────────── */}
        <section className="space-y-3">
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Welcome to EscrowHubs</p>
              <p className="text-slate-400 text-sm mt-0.5">Trustless escrow on BlockDAG — connect your wallet to get started.</p>
            </div>
            <Link href="/dashboard" className="shrink-0 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium hover:bg-cyan-400/15 transition-all">
              Go to Dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/create" className="rounded-xl border border-white/8 bg-white/3 p-5 hover:border-cyan-400/20 transition-all group">
              <div className="text-2xl mb-2">⬡</div>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">Create New Escrow</h3>
              <p className="text-xs text-slate-500 mt-1">Start a simple or milestone escrow in seconds</p>
            </Link>
            <Link href="/dashboard" className="rounded-xl border border-white/8 bg-white/3 p-5 hover:border-cyan-400/20 transition-all group">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">View Existing</h3>
              <p className="text-xs text-slate-500 mt-1">Open your dashboard to manage active escrows</p>
            </Link>
          </div>
        </section>

        {/* ── Feature Cards ────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className={`rounded-xl border p-6 ${f.accent.split(" ").slice(0, 2).join(" ")}`}
            >
              <div className={`text-2xl mb-3 ${f.accent.split(" ")[2]}`}>{f.icon}</div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* ── How It Works CTA ─────────────────────────────────────── */}
        <section>
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-3xl">📘</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white">How EscrowHubs Works</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Learn how to use escrows with anyone worldwide. See how roles work, how funds move, and how disputes are resolved — all on-chain.
                </p>
              </div>
              <Link href="/learn" className="shrink-0 px-5 py-2.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium hover:bg-cyan-400/15 transition-all">
                Open Guide →
              </Link>
            </div>
          </div>
        </section>

        {/* ── AI Arbiter ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-violet-400/15 bg-violet-400/3 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-4 py-1.5 text-xs text-violet-300">
              🤖 Powered by AI
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Disputes Resolved by AI,{" "}
              <span className="text-purple-400" style={{ textShadow: "0 0 30px rgba(168,85,247,0.4)" }}>Not Lawyers</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Select AI Arbiter when creating an escrow. Both parties submit evidence on-chain — our AI oracle reviews it and executes the ruling automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4"
              >
                <p className="text-2xl font-bold font-mono text-purple-400 mb-2">{s.step}</p>
                <p className="font-semibold text-white text-sm mb-1">{s.title}</p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-sm">AI Arbiter Pricing</p>
              <p className="text-xs text-slate-400 mt-0.5">0.5% protocol fee on all escrows · +1 BDAG flat fee when AI Arbiter is selected</p>
            </div>
            <Link href="/create" className="shrink-0 px-5 py-2 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/20 transition-all">
              Create Escrow →
            </Link>
          </div>
        </section>

        {/* ── Protocol Stats ───────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/3 p-5">
              <p className="text-3xl font-bold font-mono text-cyan-400" style={{ textShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
                {s.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 text-center text-xs text-slate-600">
        Built on BlockDAG · Featured on BlockDAG Academy ·{" "}
        <a href="https://github.com/philipmisner63-ux/blockdag-escrow" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
