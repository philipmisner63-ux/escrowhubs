"use client";

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">How It Works</h1>
        <p className="mt-1 text-slate-400 text-sm">Architecture, interaction diagrams, and role-based flow explanation.</p>
      </div>

      {/* Simple Escrow Flow */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Simple Escrow Flow</h2>
        <div className="rounded-xl bg-black/40 border border-white/8 p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">{`
  DEPOSITOR                 CONTRACT                  BENEFICIARY
      │                        │                          │
      │── createSimpleEscrow ──▶│                          │
      │   (sends BDAG + fees)   │                          │
      │                        │◀── (arbiter set) ────────│
      │                        │                          │
      │                   [AWAITING_DELIVERY]              │
      │                        │                          │
      │──── release() ─────────▶│                          │
      │                        │──── transfer BDAG ───────▶│
      │                        │                          │
      │                   [COMPLETE]                       │
      │                        │                          │

  ── OR ──

      │──── dispute() ─────────▶│
      │                        │
      │                   [DISPUTED]
      │                        │
      │          ARBITER calls resolveRelease() or resolveRefund()
      │                        │
      │                   [COMPLETE / REFUNDED]
`}</div>
      </section>

      {/* Milestone Escrow Flow */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Milestone Escrow Flow</h2>
        <div className="rounded-xl bg-black/40 border border-white/8 p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">{`
  DEPOSITOR                 CONTRACT                  BENEFICIARY
      │                        │                          │
      │── createMilestoneEscrow▶│                          │
      │   (sends total BDAG)    │ Milestones: [M1][M2][M3] │
      │                        │                          │
      │──── fund() ────────────▶│                          │
      │                        │                          │
      │                   [FUNDED — milestones PENDING]    │
      │                        │                          │
      │── releaseMilestone(0) ──▶│                          │
      │                        │── transfer M1 BDAG ──────▶│
      │                        │   M1: [RELEASED]          │
      │                        │                          │
      │── releaseMilestone(1) ──▶│                          │
      │                        │── transfer M2 BDAG ──────▶│
      │                        │   M2: [RELEASED]          │
      │                        │                          │
      │── disputeMilestone(2) ──▶│                          │
      │                        │   M3: [DISPUTED]          │
      │         ARBITER resolves M3                        │
      │                        │                          │
`}</div>
      </section>

      {/* AI Arbiter Flow */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">AI Arbiter Flow</h2>
        <div className="rounded-xl bg-black/40 border border-white/8 p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">{`
  PARTY A / B               AI ARBITER CONTRACT         ORACLE SERVICE
      │                           │                           │
      │── submitEvidence(uri) ────▶│                           │
      │   (on-chain, both parties) │                           │
      │                           │◀── polls for new disputes─│
      │                           │                           │
      │                           │── getAllEvidence() ───────▶│
      │                           │◀── evidence array ────────│
      │                           │                           │
      │                           │   Claude AI analyzes      │
      │                           │   evidence + escrow state │
      │                           │                           │
      │                           │── resolveRelease() ───────│
      │                           │   OR resolveRefund()      │
      │                           │                           │
      │◀── funds transferred ─────│                           │
`}</div>
      </section>

      {/* Role Matrix */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Role Interaction Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-3 px-4 text-slate-400 text-xs uppercase tracking-widest">Action</th>
                <th className="text-center py-3 px-4 text-cyan-400 text-xs uppercase">Depositor</th>
                <th className="text-center py-3 px-4 text-purple-400 text-xs uppercase">Beneficiary</th>
                <th className="text-center py-3 px-4 text-yellow-400 text-xs uppercase">Arbiter</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Create Escrow",        "✅", "—",  "—" ],
                ["Deposit / Fund",       "✅", "—",  "—" ],
                ["Release Funds",        "✅", "—",  "—" ],
                ["Raise Dispute",        "✅", "—",  "—" ],
                ["Submit Evidence",      "✅", "✅", "—" ],
                ["Resolve (Release)",    "—",  "—",  "✅"],
                ["Resolve (Refund)",     "—",  "—",  "✅"],
                ["View Escrow",          "✅", "✅", "✅"],
              ].map(([action, dep, ben, arb]) => (
                <tr key={action as string} className="border-b border-white/5 hover:bg-white/2">
                  <td className="py-2.5 px-4 text-slate-300">{action}</td>
                  <td className="py-2.5 px-4 text-center">{dep}</td>
                  <td className="py-2.5 px-4 text-center">{ben}</td>
                  <td className="py-2.5 px-4 text-center">{arb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contract Architecture */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Contract Architecture</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "EscrowFactory",    color: "border-cyan-400/20 bg-cyan-400/5",    desc: "Deploys all escrow contracts. Tracks all escrows. Collects protocol fees." },
            { name: "SimpleEscrow",     color: "border-purple-400/20 bg-purple-400/5", desc: "Single-release escrow. State machine: AWAITING_PAYMENT → AWAITING_DELIVERY → COMPLETE/REFUNDED." },
            { name: "MilestoneEscrow",  color: "border-blue-400/20 bg-blue-400/5",    desc: "Per-milestone release. Each milestone has independent state: PENDING → RELEASED/DISPUTED/REFUNDED." },
            { name: "AIArbiter",        color: "border-violet-400/20 bg-violet-400/5", desc: "Stores evidence on-chain. Called by oracle service to execute dispute resolutions." },
            { name: "TrustScoreOracle", color: "border-yellow-400/20 bg-yellow-400/5", desc: "Tracks wallet trust scores. Used to assign trust tiers at escrow creation." },
          ].map(({ name, color, desc }) => (
            <div key={name} className={`rounded-xl border p-4 ${color}`}>
              <p className="font-mono font-semibold text-white text-sm mb-1">{name}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
