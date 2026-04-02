"use client";

import { motion } from "framer-motion";

const ICON_STEPS = [
  { icon: "📄", title: "Create Escrow",                  desc: "Contract is created with roles & terms" },
  { icon: "💰", title: "Deposit Funds",                  desc: "Depositor locks funds into the contract" },
  { icon: "🧾", title: "Work or Transaction Completed",  desc: "Beneficiary delivers work or completes transaction" },
  { icon: "⚖️", title: "Release or Dispute",              desc: "Parties choose outcome or escalate to arbiter" },
  { icon: "🔓", title: "Funds Released",                 desc: "Smart contract settles on-chain" },
];

function AnimatedIconFlow() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Animated Escrow Flow</h2>
      <div className="flex flex-col gap-5 max-w-lg">
        {ICON_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-[#333] bg-[#111] p-5"
            style={{ boxShadow: "0 0 12px rgba(0,0,0,0.4)" }}
          >
            <div className="text-4xl shrink-0">{step.icon}</div>
            <div>
              <h3 className="text-white font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const ASCII_STEPS = [
  `┌──────────────┐\n│  1. Create   │\n│   Escrow     │\n└──────────────┘`,
  ` │\n ▼`,
  `┌──────────────┐\n│  2. Deposit  │\n│    Funds     │\n└──────────────┘`,
  ` │\n ▼`,
  `┌──────────────┐\n│  3. Work or  │\n│ Transaction  │\n│  Completed   │\n└──────────────┘`,
  ` │\n ▼`,
  `┌──────────────┐\n│ 4. Release or│\n│   Dispute    │\n└──────────────┘`,
  ` │\n ▼`,
  `┌──────────────┐\n│ 5. Funds Move│\n│   On‑Chain   │\n└──────────────┘`,
];

function AnimatedLinearFlow() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Animated Simple Linear Flow</h2>
      <div className="flex flex-col gap-0 max-w-xs">
        {ASCII_STEPS.map((ascii, i) => (
          <motion.pre
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            style={{
              background: ascii.startsWith(" │") ? "transparent" : "#111",
              color: "#0ff",
              padding: ascii.startsWith(" │") ? "0 16px" : "16px",
              borderRadius: "8px",
              fontSize: "14px",
              lineHeight: "18px",
              border: ascii.startsWith(" │") ? "none" : "1px solid #333",
              whiteSpace: "pre",
              boxShadow: ascii.startsWith(" │") ? "none" : "0 0 12px rgba(0,0,0,0.4)",
            }}
          >
            {ascii}
          </motion.pre>
        ))}
      </div>
    </section>
  );
}

const TIMELINE_STEPS = [
  { title: "1. Create Escrow",                   desc: "User sets terms & roles" },
  { title: "2. Deposit Funds",                   desc: "Funds locked on-chain" },
  { title: "3. Work or Transaction Completed",   desc: "Beneficiary delivers or transaction finishes" },
  { title: "4. Release or Dispute",              desc: "Parties choose outcome" },
  { title: "5. Funds Released",                  desc: "On-chain settlement" },
];

function AnimatedTimeline() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">Animated Escrow Timeline</h2>
      <div className="flex flex-col gap-4 max-w-lg">
        {TIMELINE_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            className="rounded-xl border border-white/10 bg-[#111] p-5"
            style={{ boxShadow: "0 0 12px rgba(0,0,0,0.4)" }}
          >
            <h3 className="text-white font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-slate-400">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

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

      <AnimatedIconFlow />
      <AnimatedLinearFlow />
      <AnimatedTimeline />
      <LinearSteps />
      <DiagramBlock title="Three‑Party Flow"     diagram={THREE_PARTY}   />
      <DiagramBlock title="Circular Trust Loop"  diagram={CIRCULAR}      />
    </div>
  );
}
