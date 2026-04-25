"use client";

import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Escrow",                 desc: "Contract is created with roles & terms" },
  { icon: "💰", title: "Deposit Funds",                 desc: "Depositor locks funds into the contract" },
  { icon: "🧾", title: "Work or Transaction Completed", desc: "Beneficiary delivers work or completes transaction" },
  { icon: "⚖️", title: "Release or Dispute",             desc: "Parties choose outcome or escalate to arbiter" },
  { icon: "🔓", title: "Funds Released",                desc: "Smart contract settles on-chain" },
];

export default function EscrowFlowPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Escrow Flow</h1>
        <p className="mt-1 text-slate-400 text-sm">Step-by-step animated view of how a single escrow moves from creation to settlement.</p>
      </div>
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111] p-5 shadow-lg"
          >
            <span className="text-4xl shrink-0">{step.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
