"use client";

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

      <DiagramBlock title="Simple Linear Flow"   diagram={SIMPLE_LINEAR} />
      <DiagramBlock title="Three‑Party Flow"     diagram={THREE_PARTY}   />
      <DiagramBlock title="Circular Trust Loop"  diagram={CIRCULAR}      />
    </div>
  );
}
