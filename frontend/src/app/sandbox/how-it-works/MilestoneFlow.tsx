"use client";
import { motion } from "framer-motion";

const steps = [
  { icon: "📄", title: "Create Milestone Escrow", desc: "Contract created with multiple milestones" },
  { icon: "💰", title: "Fund Escrow",             desc: "Depositor funds total BDAG upfront" },
  { icon: "⏳", title: "Milestones Pending",      desc: "Escrow funded — milestones awaiting release" },
  { icon: "🟩", title: "Release Milestone",       desc: "Depositor releases milestone BDAG to beneficiary" },
  { icon: "⚠️", title: "Dispute Milestone",        desc: "Depositor disputes milestone — arbiter reviews" },
  { icon: "⚖️", title: "Arbiter Resolves",         desc: "Arbiter releases or refunds milestone" },
];

export default function MilestoneFlow() {
  return (
    <div style={{ marginBottom: "60px" }}>
      <h2 style={{ color: "white", marginBottom: "20px" }}>Milestone Escrow Flow</h2>
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
