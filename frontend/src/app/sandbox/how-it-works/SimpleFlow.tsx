"use client";
import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Escrow",                 desc: "Contract created with roles & terms" },
  { icon: "💰", title: "Deposit Funds",                 desc: "Depositor locks BDAG into contract" },
  { icon: "🧾", title: "Work or Transaction Completed", desc: "Beneficiary completes work or transaction" },
  { icon: "⚖️", title: "Release or Dispute",             desc: "Parties choose outcome or escalate to arbiter" },
  { icon: "🔓", title: "Funds Released",                desc: "Smart contract settles on-chain" },
];

export default function SimpleFlow() {
  return (
    <div style={{ marginBottom: "60px" }}>
      <h2 style={{ color: "white", marginBottom: "20px" }}>Simple Escrow Flow</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.35, ease: "easeOut" }}
            style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "20px", borderRadius: "12px", border: "1px solid #333",
              background: "#111", color: "white", boxShadow: "0 0 12px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "40px" }}>{step.icon}</div>
            <div>
              <h3 style={{ margin: 0 }}>{step.title}</h3>
              <p style={{ marginTop: "6px", opacity: 0.8 }}>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
