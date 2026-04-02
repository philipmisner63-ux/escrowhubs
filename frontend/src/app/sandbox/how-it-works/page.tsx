"use client";

import { SimpleFlow } from "@/components/how-it-works/SimpleFlow";
import { MilestoneFlow } from "@/components/how-it-works/MilestoneFlow";
import { AIArbiterFlow } from "@/components/how-it-works/AIArbiterFlow";

export default function SandboxHowItWorksPage() {
  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white">How It Works</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Three escrow flows — simple, milestone, and AI-arbiter. These are the same components used in production.
        </p>
      </div>
      <SimpleFlow />
      <MilestoneFlow />
      <AIArbiterFlow />
    </div>
  );
}
