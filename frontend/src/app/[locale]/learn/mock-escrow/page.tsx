"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MOCK_SIMPLE_ESCROW, MOCK_MILESTONE_ESCROW } from "../mock-data";

type EscrowTab = "simple" | "milestone";

const STATE_COLORS: Record<string, string> = {
  "Awaiting Delivery": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Complete":          "text-green-400 bg-green-400/10 border-green-400/20",
  "Disputed":          "text-red-400 bg-red-400/10 border-red-400/20",
  "Released":          "text-green-400 bg-green-400/10 border-green-400/20",
  "Pending":           "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

function AddressBadge({ address }: { address: string }) {
  return (
    <span className="font-mono text-xs text-slate-300">
      {address.slice(0, 10)}…{address.slice(-6)}
    </span>
  );
}

export default function MockEscrowPage() {
  const [tab, setTab] = useState<EscrowTab>("simple");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mock Escrow Viewer</h1>
        <p className="mt-1 text-slate-400 text-sm">Static mock data — no blockchain calls. Explore escrow detail UI.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["simple", "milestone"] as EscrowTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize",
              tab === t
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "border-white/10 text-slate-400 hover:text-white"
            )}
          >
            {t} Escrow
          </button>
        ))}
      </div>

      {tab === "simple" && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Simple Escrow</h2>
                  <span className={cn("text-xs px-2 py-1 rounded-full border", STATE_COLORS[MOCK_SIMPLE_ESCROW.stateLabel])}>
                    {MOCK_SIMPLE_ESCROW.stateLabel}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full border text-cyan-400 bg-cyan-400/10 border-cyan-400/20">
                    You: Depositor
                  </span>
                </div>
                <AddressBadge address={MOCK_SIMPLE_ESCROW.address} />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500 mb-1">Amount</p>
                <p className="text-2xl font-bold text-white">{MOCK_SIMPLE_ESCROW.amount}</p>
                <p className="text-xs text-slate-500">{MOCK_SIMPLE_ESCROW.symbol}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Depositor",   MOCK_SIMPLE_ESCROW.depositor],
                ["Beneficiary", MOCK_SIMPLE_ESCROW.beneficiary],
                ["Arbiter",     MOCK_SIMPLE_ESCROW.arbiter],
              ].map(([label, addr]) => (
                <div key={label} className="rounded-xl bg-white/3 border border-white/8 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <AddressBadge address={addr} />
                </div>
              ))}
            </div>
          </div>

          {/* Actions card */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/3 border border-white/8 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Release Funds</p>
                  <p className="text-xs text-slate-500 mt-0.5">Send {MOCK_SIMPLE_ESCROW.amount} BDAG to beneficiary</p>
                </div>
                <button disabled className="px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm opacity-50 cursor-not-allowed">
                  Release
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/3 border border-white/8 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Raise Dispute</p>
                  <p className="text-xs text-slate-500 mt-0.5">Escalate to arbiter for resolution</p>
                </div>
                <button disabled className="px-4 py-2 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm opacity-50 cursor-not-allowed">
                  Dispute
                </button>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Event Log</h3>
            <div className="space-y-2">
              {MOCK_SIMPLE_ESCROW.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-mono">{ev.time}</span>
                  <span className="text-cyan-400 font-medium">{ev.name}</span>
                  <span className="text-slate-600">by {ev.actor}</span>
                  <span className="font-mono text-slate-600">{ev.txHash.slice(0, 10)}…</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "milestone" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Milestone Escrow</h2>
                  <span className="text-xs px-2 py-1 rounded-full border text-green-400 bg-green-400/10 border-green-400/20">Funded</span>
                  <span className="text-xs px-2 py-1 rounded-full border text-cyan-400 bg-cyan-400/10 border-cyan-400/20">You: Depositor</span>
                </div>
                <AddressBadge address={MOCK_MILESTONE_ESCROW.address} />
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{MOCK_MILESTONE_ESCROW.totalDeposited}</p>
                <p className="text-xs text-slate-500">{MOCK_MILESTONE_ESCROW.symbol}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Depositor",   MOCK_MILESTONE_ESCROW.depositor],
                ["Beneficiary", MOCK_MILESTONE_ESCROW.beneficiary],
                ["Arbiter",     MOCK_MILESTONE_ESCROW.arbiter],
              ].map(([label, addr]) => (
                <div key={label} className="rounded-xl bg-white/3 border border-white/8 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <AddressBadge address={addr} />
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Milestones (2/{MOCK_MILESTONE_ESCROW.milestones.length})
              </h3>
            </div>
            <div className="h-2 rounded-full bg-white/5 mb-4">
              <div className="h-2 rounded-full bg-cyan-400/60" style={{ width: "50%" }} />
            </div>
            <div className="space-y-3">
              {MOCK_MILESTONE_ESCROW.milestones.map((ms, i) => (
                <div key={i} className="rounded-xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-mono text-slate-400 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{ms.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ms.amount} BDAG</p>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full border shrink-0", STATE_COLORS[ms.stateLabel])}>
                    {ms.stateLabel}
                  </span>
                  {ms.state === 0 && (
                    <div className="flex gap-2 shrink-0">
                      <button disabled className="h-7 px-3 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed opacity-50">Release</button>
                      <button disabled className="h-7 px-3 text-xs rounded-lg bg-red-400/5 border border-red-400/10 text-red-500 cursor-not-allowed opacity-50">Dispute</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Event log */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Event Log</h3>
            <div className="space-y-2">
              {MOCK_MILESTONE_ESCROW.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-mono">{ev.time}</span>
                  <span className="text-cyan-400 font-medium">{ev.name}</span>
                  <span className="text-slate-600">by {ev.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
