"use client";

import SimpleFlow from "./SimpleFlow";
import MilestoneFlow from "./MilestoneFlow";
import AIArbiterFlow from "./AIArbiterFlow";

export default function HowItWorksPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ color: "white", marginBottom: "40px" }}>How Escrow Works</h1>
      <SimpleFlow />
      <MilestoneFlow />
      <AIArbiterFlow />
    </div>
  );
}
