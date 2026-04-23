"use client";

import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Escrow",                 desc: "Contract created with roles & terms" },
  { icon: "💰", title: "Deposit Funds",                 desc: "Depositor locks ETH into contract" },
  { icon: "🧾", title: "Product or Service Delivered",  desc: "Beneficiary delivers the product, service, or work" },
  { icon: "⚖️", title: "Release or Dispute",             desc: "Parties choose outcome or escalate to arbiter" },
  { icon: "🔓", title: "Funds Released",                desc: "Smart contract settles on-chain" },
];

export function SimpleFlow() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Simple Escrow Flow</h2>
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.2, ease: "easeOut" }}
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
