"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FlowView = "overview" | "simple" | "milestone" | "dispute";

export default function GlobalFlowPage() {
  const [view, setView] = useState<FlowView>("overview");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Flow</h1>
        <p className="mt-1 text-slate-400 text-sm">Visual map of how EscrowHubs works across all parties and use cases.</p>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2">
        {(["overview", "simple", "milestone", "dispute"] as FlowView[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize",
              view === v
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-white/10 text-slate-400 hover:text-white"
            )}
          >
            {v === "overview" ? "🌍 Overview" : v === "simple" ? "⬡ Simple Flow" : v === "milestone" ? "◈ Milestone Flow" : "⚡ Dispute Flow"}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <div className="space-y-6">
          {/* Global actor map */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-5">Multi-Party Interaction Map</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { role: "Depositor", icon: "💼", color: "border-cyan-400/30 bg-cyan-400/5 text-cyan-400", desc: "Locks funds, releases or disputes" },
                { role: "Beneficiary", icon: "🎯", color: "border-purple-400/30 bg-purple-400/5 text-purple-400", desc: "Receives funds on completion" },
                { role: "Arbiter", icon: "⚖️", color: "border-yellow-400/30 bg-yellow-400/5 text-yellow-400", desc: "Resolves disputes" },
              ].map(({ role, icon, color, desc }) => (
                <div key={role} className={cn("rounded-xl border p-4", color)}>
                  <div className="text-3xl mb-2">{icon}</div>
                  <p className="font-semibold text-white text-sm">{role}</p>
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Arrows */}
            <div className="mt-5 rounded-xl bg-black/40 border border-white/8 p-4 font-mono text-xs text-slate-400 leading-loose overflow-x-auto whitespace-pre">{`
  Depositor ──── createEscrow() ──────────────────────▶ EscrowFactory
  Depositor ──── release() / dispute() ───────────────▶ SimpleEscrow / MilestoneEscrow
  Beneficiary ── submitEvidence() ─────────────────────▶ AIArbiter (if disputed)
  Arbiter ─────── resolveRelease() / resolveRefund() ──▶ SimpleEscrow / MilestoneEscrow
  Oracle ──────── polls AIArbiter ──── AI analyzes ────▶ executes resolve()
  Anyone ─────── view dashboard ───────────────────────▶ EscrowFactory.getEscrows()
`}</div>
          </div>

          {/* Platform overview */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Global Usage",    icon: "🌍", items: ["Any two parties worldwide", "No trusted middleman", "Funds locked in smart contract", "Transparent on-chain state"] },
              { title: "Trust Model",     icon: "🔐", items: ["Code is the arbiter", "No admin keys on escrow", "Factory owner only collects fees", "AI arbiter runs on-chain evidence"] },
              { title: "Fee Structure",   icon: "💰", items: ["0.5% protocol fee at creation", "+1 BDAG flat for AI Arbiter", "Fees go to factory contract", "Owner can withdraw accumulated fees"] },
              { title: "Supported Flows", icon: "🔀", items: ["Simple: single payment release", "Milestone: phased payments", "Dispute: human or AI arbiter", "Refund: if depositor wins dispute"] },
            ].map(({ title, icon, items }) => (
              <div key={title} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{icon}</span>
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                </div>
                <ul className="space-y-1">
                  {items.map(item => (
                    <li key={item} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-slate-600 mt-0.5">›</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "simple" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto whitespace-pre">{`
╔══════════════════════════════════════════════════════════════╗
║                    SIMPLE ESCROW LIFECYCLE                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Step 1 ── DEPOSITOR calls createSimpleEscrow()             ║
║            sends: BDAG amount + 0.5% fee                    ║
║            specifies: beneficiary, arbiter                   ║
║                         │                                    ║
║                         ▼                                    ║
║  State: AWAITING_PAYMENT ──▶ AWAITING_DELIVERY              ║
║         (auto-transitions when deposit received)             ║
║                         │                                    ║
║                         ▼                                    ║
║  Step 2 ── Wait for delivery / work completion               ║
║                         │                                    ║
║                    ┌────┴────┐                               ║
║                    │         │                               ║
║                    ▼         ▼                               ║
║  Step 3A         release() dispute()                         ║
║  Depositor       sends to   raises                           ║
║  satisfied       beneficiary dispute                         ║
║                    │         │                               ║
║                    ▼         ▼                               ║
║               COMPLETE    DISPUTED                           ║
║                          arbiter                             ║
║                          resolves                            ║
║                         ┌────┴────┐                          ║
║                         ▼         ▼                          ║
║                    COMPLETE    REFUNDED                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { state: "AWAITING_PAYMENT",  color: "text-slate-400 border-slate-400/20 bg-slate-400/5",  desc: "Contract deployed, waiting for deposit" },
              { state: "AWAITING_DELIVERY", color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5", desc: "Funded, waiting for work/delivery" },
              { state: "COMPLETE",          color: "text-green-400 border-green-400/20 bg-green-400/5",   desc: "Funds released to beneficiary" },
              { state: "DISPUTED",          color: "text-red-400 border-red-400/20 bg-red-400/5",         desc: "Under arbiter review" },
              { state: "REFUNDED",          color: "text-blue-400 border-blue-400/20 bg-blue-400/5",      desc: "Funds returned to depositor" },
            ].map(({ state, color, desc }) => (
              <div key={state} className={cn("rounded-xl border p-3", color)}>
                <p className="font-mono font-semibold mb-1">{state}</p>
                <p className="text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "milestone" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto whitespace-pre">{`
╔══════════════════════════════════════════════════════════════╗
║                  MILESTONE ESCROW LIFECYCLE                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Step 1 ── createMilestoneEscrow(beneficiary, arbiter,       ║
║              ["M1","M2","M3"], [2.5, 3.0, 4.0 BDAG])        ║
║                         │                                    ║
║                         ▼                                    ║
║  Step 2 ── fund()  (depositor sends total)                  ║
║            Contract funded. All milestones: [PENDING]        ║
║                                                              ║
║  ┌─────────┐   ┌─────────┐   ┌─────────┐                   ║
║  │   M1    │   │   M2    │   │   M3    │                   ║
║  │ PENDING │   │ PENDING │   │ PENDING │                   ║
║  └─────────┘   └─────────┘   └─────────┘                   ║
║       │               │             │                        ║
║       ▼               ▼             ▼                        ║
║  releaseMilestone(0)  release(1)   disputeMilestone(2)       ║
║       │               │             │                        ║
║       ▼               ▼             ▼                        ║
║  [RELEASED]      [RELEASED]     [DISPUTED]                  ║
║  pays M1 BDAG    pays M2 BDAG   arbiter resolves             ║
║                                      │                       ║
║                               ┌──────┴──────┐               ║
║                               ▼              ▼               ║
║                          [RELEASED]      [REFUNDED]          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}</div>
        </div>
      )}

      {view === "dispute" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto whitespace-pre">{`
╔══════════════════════════════════════════════════════════════╗
║                     DISPUTE RESOLUTION                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  HUMAN ARBITER FLOW:                                         ║
║                                                              ║
║  Depositor ──── dispute() ──────────▶ escrow: [DISPUTED]    ║
║                                                              ║
║  Arbiter reviews off-chain evidence                          ║
║                                                              ║
║  Arbiter ─── resolveRelease() ──────▶ funds → beneficiary   ║
║     OR                                                       ║
║  Arbiter ─── resolveRefund() ───────▶ funds → depositor     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  AI ARBITER FLOW:                                            ║
║                                                              ║
║  Depositor ──── dispute() ──────────▶ escrow: [DISPUTED]    ║
║                                                              ║
║  Both parties call submitEvidence(escrowAddr, evidenceURI)  ║
║  (stores evidence permanently on-chain in AIArbiter)         ║
║                                                              ║
║  Oracle service polls AIArbiter every 30 seconds            ║
║                                                              ║
║  Oracle ─── getAllEvidence(escrowAddr) ──────────────────▶  ║
║  Oracle ─── sends evidence + escrow state to Claude AI ──▶  ║
║  Claude analyzes: "Who is right based on the evidence?"      ║
║                                                              ║
║  Oracle ─── resolveRelease(escrowAddr) ─────────────────▶   ║
║     OR                                                       ║
║  Oracle ─── resolveRefund(escrowAddr) ──────────────────▶   ║
║                                                              ║
║  Funds transferred automatically. No human required.         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}</div>
        </div>
      )}
    </div>
  );
}
