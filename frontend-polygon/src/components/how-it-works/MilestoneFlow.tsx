"use client";

import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Milestone Escrow", desc: "Contract created with multiple milestones" },
  { icon: "💰", title: "Fund Escrow",             desc: "Depositor funds total ETH upfront" },
  { icon: "⏳", title: "Milestones Pending",      desc: "Escrow funded — milestones awaiting release" },
  { icon: "🟩", title: "Release Milestone",       desc: "Depositor releases milestone ETH to beneficiary" },
  { icon: "⚠️", title: "Dispute Milestone",        desc: "Depositor disputes milestone — arbiter reviews" },
  { icon: "⚖️", title: "Arbiter Resolves",         desc: "Arbiter releases or refunds milestone" },
];

export function MilestoneFlow() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Milestone Escrow Flow</h2>
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/3 p-5 shadow-lg"
          >
            <span className="text-4xl shrink-0">{step.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
