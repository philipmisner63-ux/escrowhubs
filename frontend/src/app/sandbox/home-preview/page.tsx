"use client";

import Link from "next/link";

export default function HomePreviewPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Home Page Preview</h1>
        <p className="mt-1 text-slate-400 text-sm">Mock landing page concept — no production code affected.</p>
      </div>

      {/* Simulated browser chrome */}
      <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Nav */}
        <div className="bg-black/60 border-b border-white/8 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold text-white text-sm">EscrowHubs.io</span>
            <div className="hidden sm:flex items-center gap-5 text-xs text-slate-400">
              <span className="text-cyan-400 font-medium">Home</span>
              <span className="hover:text-white cursor-pointer">Create Escrow</span>
              <span className="hover:text-white cursor-pointer">Dashboard</span>
              <span className="hover:text-white cursor-pointer">Support</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium">
            Connect Wallet
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-[#080a10] to-[#060608] px-6 py-10 text-center space-y-3 border-b border-white/8">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-medium">BlockDAG Mainnet · Chain 1404</p>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Build trust.<br />
            Move value.<br />
            <span className="text-cyan-400" style={{ textShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
              Escrow with anyone, anywhere.
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Trustless smart contract escrow on BlockDAG. Simple or milestone-based payments with AI dispute resolution.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <div className="px-5 py-2.5 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-sm font-semibold cursor-pointer hover:bg-cyan-400/20 transition-all">
              Create New Escrow
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm cursor-pointer hover:bg-white/8 transition-all">
              View Existing
            </div>
          </div>
        </div>

        {/* Welcome card */}
        <div className="bg-[#060608] px-6 py-5 border-b border-white/8">
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Welcome back, Philip</p>
              <p className="text-slate-400 text-xs mt-0.5">You have 2 active escrows · 1 awaiting action</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium cursor-pointer">
              Go to Dashboard →
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="bg-[#060608] px-6 py-5 grid grid-cols-2 gap-3 border-b border-white/8">
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 hover:border-cyan-400/20 transition-all cursor-pointer">
            <div className="text-2xl mb-2">⬡</div>
            <h3 className="font-semibold text-white text-sm">Create New Escrow</h3>
            <p className="text-xs text-slate-500 mt-1">Start a simple or milestone escrow in seconds</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 hover:border-cyan-400/20 transition-all cursor-pointer">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-white text-sm">View Existing</h3>
            <p className="text-xs text-slate-500 mt-1">Enter an escrow address to view its status</p>
          </div>
        </div>

        {/* How it works CTA */}
        <div className="bg-[#060608] px-6 py-5">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-5">
            <div className="flex items-start gap-4">
              <span className="text-2xl">📘</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">How EscrowHubs Works</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Learn how to use escrows with anyone worldwide. See how roles work, how funds move, and how disputes are resolved — all on-chain.
                </p>
              </div>
              <Link
                href="/sandbox/how-it-works"
                className="shrink-0 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium hover:bg-cyan-400/15 transition-all"
              >
                Open Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Escrows",    value: "2",       color: "text-cyan-400"   },
          { label: "Total Value Locked", value: "17.5 BDAG", color: "text-white"   },
          { label: "Completed",         value: "3",       color: "text-green-400"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 text-center">
        This is a sandbox preview — <Link href="/sandbox" className="text-amber-400 hover:underline">back to sandbox index</Link>
      </p>
    </div>
  );
}
