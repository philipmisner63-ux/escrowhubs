"use client";

import Link from "next/link";

const PAGES = [
  { href: "/sandbox/onboarding",   label: "Onboarding Flow",    icon: "🚀", desc: "Step-by-step wallet connect and network switching simulation" },
  { href: "/sandbox/how-it-works", label: "How It Works",       icon: "⚙️",  desc: "Architecture diagrams and multi-party flow explanation" },
  { href: "/sandbox/faq",          label: "FAQ",                icon: "❓", desc: "Common questions about escrow, fees, disputes, and wallets" },
  { href: "/sandbox/mock-escrow",  label: "Mock Escrow Viewer", icon: "📋", desc: "Interactive escrow detail page with static mock data" },
  { href: "/sandbox/role-view",    label: "Role View Toggle",   icon: "👥", desc: "See how the UI changes for depositor, beneficiary, and arbiter" },
  { href: "/sandbox/network-sim",  label: "Network Simulator",  icon: "🌐", desc: "Simulate connected, disconnected, and wrong-network states" },
  { href: "/sandbox/global-flow",  label: "Global Flow",        icon: "🗺️",  desc: "Visual map of multi-party global usage" },
];

export default function SandboxIndexPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">EscrowHubs Sandbox</h1>
        <p className="mt-2 text-slate-400">
          Local-only preview environment. No wallet required, no blockchain calls, no production code affected.
          Use these pages to explore the app flow, test UI states, and demonstrate features.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PAGES.map(({ href, label, icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-white/8 bg-white/3 p-5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{label}</h3>
            </div>
            <p className="text-sm text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">About This Sandbox</h3>
        <ul className="space-y-1.5 text-sm text-slate-400">
          <li>✅ Zero blockchain calls — all data is static JSON</li>
          <li>✅ No wagmi or wallet providers loaded</li>
          <li>✅ Production routes are completely unaffected</li>
          <li>✅ All sandbox pages live under <code className="text-amber-300 bg-black/30 px-1 rounded">/sandbox/*</code></li>
          <li>✅ Separate layout — no nav, no wallet button, no chain switching</li>
        </ul>
      </div>
    </div>
  );
}
