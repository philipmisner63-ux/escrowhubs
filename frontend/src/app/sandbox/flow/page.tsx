"use client";

import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Escrow",                 desc: "Contract is created with roles & terms" },
  { icon: "💰", title: "Deposit Funds",                 desc: "Depositor locks funds into the contract" },
  { icon: "🧾", title: "Work or Transaction Completed", desc: "Beneficiary delivers work or completes transaction" },
  { icon: "⚖️", title: "Release or Dispute",             desc: "Parties choose outcome or escalate to arbiter" },
  { icon: "🔓", title: "Funds Released",                desc: "Smart contract settles on-chain" },
];

export default function FlowPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px", color: "white" }}>Escrow Flow</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #333",
              background: "#111",
              color: "white",
              boxShadow: "0 0 12px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "40px" }}>{step.icon}</div>
            <div>
              <h2 style={{ margin: 0 }}>{step.title}</h2>
              <p style={{ marginTop: "6px", opacity: 0.8 }}>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
