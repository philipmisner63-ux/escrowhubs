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

const stats = [
  { value: "47+",   label: "Escrows Created" },
  { value: "284",   label: "BDAG Secured"    },
  { value: "0",     label: "Exploits"        },
  { value: "100%",  label: "On-Chain"        },
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
            No middlemen, no trust required.
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

      {/* Stats */}
      <section className="border-t border-white/8 py-16 px-4">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
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
        Built on BlockDAG · Open Source ·{" "}
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
