"use client";

import { motion } from "framer-motion";

const steps = [
  { icon: "🧾", title: "Submit Evidence",    desc: "Both parties submit evidence on-chain" },
  { icon: "🤖", title: "AI Detects Dispute", desc: "AI oracle polls for new disputes" },
  { icon: "🔍", title: "Fetch Evidence",     desc: "AI fetches all evidence from contract" },
  { icon: "🧠", title: "AI Analyzes Case",   desc: "Claude AI evaluates evidence + escrow state" },
  { icon: "⚖️", title: "AI Resolves",         desc: "AI calls resolveRelease() or resolveRefund()" },
  { icon: "🔓", title: "Funds Move",         desc: "Contract executes ruling on-chain" },
];

export function AIArbiterFlow() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-semibold text-white">AI Arbiter Flow</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/8 px-3 py-1 text-xs text-amber-300 font-medium">
          ⚖️ Patent Pending
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-5 shadow-lg"
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
