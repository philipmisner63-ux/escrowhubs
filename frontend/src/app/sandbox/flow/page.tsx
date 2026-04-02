"use client";

const STEPS = [
  { n: 1, label: "Create Escrow",    icon: "📝", desc: "Depositor deploys contract with beneficiary + arbiter" },
  { n: 2, label: "Deposit Funds",    icon: "💰", desc: "BDAG locked into the smart contract" },
  { n: 3, label: "Work Completed",   icon: "✅", desc: "Beneficiary delivers agreed work or service" },
  { n: 4, label: "Release or Dispute", icon: "⚖️", desc: "Depositor releases funds or raises a dispute" },
  { n: 5, label: "Funds Move On‑Chain", icon: "🔗", desc: "Funds sent to beneficiary or refunded on-chain" },
];

function LinearSteps() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Simple Linear Flow</h2>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step.n} className="flex items-start shrink-0">
            {/* Step card */}
            <div className="flex flex-col items-center w-36">
              <div className="w-12 h-12 rounded-full bg-cyan-400/10 border-2 border-cyan-400/40 flex items-center justify-center text-xl mb-2">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-cyan-400 mb-1">Step {step.n}</div>
              <div className="text-sm font-semibold text-white text-center leading-tight mb-1">{step.label}</div>
              <div className="text-xs text-slate-500 text-center leading-snug">{step.desc}</div>
            </div>
            {/* Arrow between steps */}
            {i < STEPS.length - 1 && (
              <div className="flex items-center mt-5 text-cyan-400/50 text-xl px-1 shrink-0">→</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DiagramBlock({ title, diagram }: { title: string; diagram: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">{title}</h2>
      <div className="rounded-xl border border-white/10 bg-black/40 p-5 overflow-x-auto">
        <pre className="font-mono text-sm text-slate-300 leading-relaxed">{diagram}</pre>
      </div>
    </section>
  );
}

const SIMPLE_LINEAR = `┌──────────────┐
│  1. Create   │
│   Escrow     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  2. Deposit  │
│    Funds     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3. Work is  │
│  Completed   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. Release or│
│   Dispute    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. Funds Move│
│   On‑Chain   │
└──────────────┘`;

const THREE_PARTY = `  Depositor          Beneficiary         Arbiter
  ──────────          ───────────         ─────────

  Creates escrow ──────────▶ Views escrow
  Deposits funds ──────────▶ Completes work
  Requests refund ◀───────── Requests release
  Opens dispute ───────────────────────────▶ Resolves dispute`;

const CIRCULAR = `       ┌──────────────────────────┐
       │     1. Create Escrow     │
       └──────────────┬───────────┘
                      │
                      ▼
       ┌──────────────────────────┐
       │     2. Deposit Funds     │
       └──────────────┬───────────┘
                      │
                      ▼
       ┌──────────────────────────┐
       │    3. Work Completed     │
       └──────────────┬───────────┘
                      │
                      ▼
       ┌──────────────────────────┐
       │  4. Release or Dispute   │
       └──────────────┬───────────┘
                      │
                      ▼
       ┌──────────────────────────┐
       │    5. Funds Released     │
       └──────────────┬───────────┘
                      │
                      ▼
                 (loops back)`;

export default function FlowPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Escrow Flow Visuals</h1>
        <p className="mt-1 text-slate-400 text-sm">Three views of how escrow works — linear, multi-party, and circular.</p>
      </div>

      <LinearSteps />
      <DiagramBlock title="Three‑Party Flow"     diagram={THREE_PARTY}   />
      <DiagramBlock title="Circular Trust Loop"  diagram={CIRCULAR}      />
    </div>
  );
}
