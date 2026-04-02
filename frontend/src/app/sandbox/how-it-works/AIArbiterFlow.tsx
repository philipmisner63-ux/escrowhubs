"use client";
import { motion } from "framer-motion";

const steps = [
  { icon: "🧾", title: "Submit Evidence",  desc: "Both parties submit evidence on-chain" },
  { icon: "🤖", title: "AI Detects Dispute", desc: "AI contract polls for new disputes" },
  { icon: "🔍", title: "Fetch Evidence",   desc: "AI fetches all evidence from contract" },
  { icon: "🧠", title: "AI Analyzes Case", desc: "Claude AI evaluates evidence + escrow state" },
  { icon: "⚖️", title: "AI Resolves",       desc: "AI calls resolveRelease() or resolveRefund()" },
  { icon: "🔓", title: "Funds Move",       desc: "Contract executes ruling on-chain" },
];

export default function AIArbiterFlow() {
  return (
    <div style={{ marginBottom: "60px" }}>
      <h2 style={{ color: "white", marginBottom: "20px" }}>AI Arbiter Flow</h2>
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
