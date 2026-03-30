"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { useDeployContract } from "wagmi";
import { Nav } from "@/components/nav";
import { PageWrapper } from "@/components/page-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { triggerDeployConfetti } from "@/lib/confetti";
import {
  SIMPLE_ESCROW_ABI,
  SIMPLE_ESCROW_BYTECODE,
  MILESTONE_ESCROW_ABI,
  MILESTONE_ESCROW_BYTECODE,
  EXPLORER_TX_URL,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

type EscrowType = "simple" | "milestone";

interface MilestoneInput {
  description: string;
  amount: string;
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const { addToast, removeToast } = useToast();
  const { deployContractAsync } = useDeployContract();

  const [type, setType] = useState<EscrowType>("simple");
  const [form, setForm] = useState({ title: "", beneficiary: "", arbiter: "", amount: "" });
  const [milestones, setMilestones] = useState<MilestoneInput[]>([{ description: "", amount: "" }]);
  const [submitting, setSubmitting] = useState(false);

  function addMilestone() { setMilestones(m => [...m, { description: "", amount: "" }]); }
  function removeMilestone(i: number) { setMilestones(m => m.filter((_, idx) => idx !== i)); }
  function updateMilestone(i: number, field: keyof MilestoneInput, value: string) {
    setMilestones(m => m.map((ms, idx) => idx === i ? { ...ms, [field]: value } : ms));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const pendingId = addToast({ type: "pending", message: "Waiting for wallet confirmation…" });

    try {
      let contractAddress: `0x${string}`;

      if (type === "simple") {
        const hash = await deployContractAsync({
          abi: SIMPLE_ESCROW_ABI,
          bytecode: SIMPLE_ESCROW_BYTECODE,
          args: [form.beneficiary as `0x${string}`, form.arbiter as `0x${string}`],
          value: parseEther(form.amount),
        });
        contractAddress = hash as `0x${string}`;
      } else {
        const descriptions = milestones.map(m => m.description);
        const amounts = milestones.map(m => parseEther(m.amount));
        const totalValue = amounts.reduce((a, b) => a + b, 0n);

        const hash = await deployContractAsync({
          abi: MILESTONE_ESCROW_ABI,
          bytecode: MILESTONE_ESCROW_BYTECODE,
          args: [form.beneficiary as `0x${string}`, form.arbiter as `0x${string}`, descriptions, amounts],
          value: totalValue,
        });
        contractAddress = hash as `0x${string}`;
      }

      removeToast(pendingId);
      addToast({
        type: "success",
        message: "Contract deployed!",
        txHash: contractAddress,
      });

      triggerDeployConfetti();
      setTimeout(() => router.push(`/escrow/${contractAddress}`), 500);

    } catch (err: unknown) {
      removeToast(pendingId);
      const msg = err instanceof Error ? err.message : "Deployment failed";
      addToast({ type: "error", message: msg.slice(0, 120) });
      setSubmitting(false);
    }
  }

  const milestoneTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <PageWrapper>
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">Create Escrow</h1>
              <p className="mt-1 text-sm text-slate-400">Deploy a new escrow contract on BlockDAG</p>
            </div>

            {/* Network banner */}
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-xs text-yellow-300">
              <strong>BlockDAG Testnet required.</strong> Connect your wallet to the BlockDAG Testnet before deploying.
              Bytecode sourced from <code className="font-mono bg-black/30 px-1 py-0.5 rounded">contracts/artifacts/</code> — run <code className="font-mono bg-black/30 px-1 py-0.5 rounded">pnpm compile</code> in <code className="font-mono">/contracts</code> to refresh.
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-4">
              {(["simple", "milestone"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "relative rounded-2xl border p-5 text-left transition-all duration-200",
                    type === t
                      ? "border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_30px_rgba(0,245,255,0.1)]"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {type === t && (
                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
                  )}
                  <div className="text-2xl mb-2">{t === "simple" ? "⬡" : "◈"}</div>
                  <h3 className="font-semibold text-white capitalize">{t} Escrow</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {t === "simple"
                      ? "Single-release. Funds released on delivery or arbiter decision."
                      : "Phased payments with per-milestone releases."}
                  </p>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <GlassCard className="p-6 space-y-5">
                <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Smart Contract Audit" />
                <Field label="Beneficiary Address" value={form.beneficiary} onChange={v => setForm(f => ({ ...f, beneficiary: v }))} placeholder="0x..." mono />
                <Field label="Arbiter Address" value={form.arbiter} onChange={v => setForm(f => ({ ...f, arbiter: v }))} placeholder="0x..." mono />

                {type === "simple" ? (
                  <Field label="Amount (BDAG)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0.0" type="number" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Milestones</label>
                      <button type="button" onClick={addMilestone} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        + Add Milestone
                      </button>
                    </div>
                    {milestones.map((ms, i) => (
                      <div key={i} className="flex gap-3 items-start rounded-xl bg-white/3 border border-white/8 p-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xs text-cyan-400 font-mono mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <input
                            className="col-span-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                            placeholder="Description"
                            value={ms.description}
                            onChange={e => updateMilestone(i, "description", e.target.value)}
                            required
                          />
                          <input
                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                            placeholder="BDAG"
                            type="number"
                            step="0.001"
                            min="0"
                            value={ms.amount}
                            onChange={e => updateMilestone(i, "amount", e.target.value)}
                            required
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button type="button" onClick={() => removeMilestone(i)} className="text-slate-600 hover:text-red-400 transition-colors">✕</button>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>Total</span>
                      <span className="text-cyan-400 font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                        {milestoneTotal.toFixed(3)} BDAG
                      </span>
                    </div>
                  </div>
                )}

                {/* Verification tier */}
                <div className="rounded-xl bg-white/3 border border-white/8 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Adaptive Verification</p>
                    <p className="text-xs text-slate-600 mt-0.5">Scales with trust score + transaction size</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Est. tier</span>
                    <p className="text-sm font-semibold text-cyan-400">Standard</p>
                  </div>
                </div>

                <GlowButton type="submit" variant="primary" loading={submitting} className="w-full py-3 text-base">
                  {submitting ? "Deploying…" : "Deploy Escrow Contract"}
                </GlowButton>
              </GlassCard>
            </form>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, mono, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type={type}
        step={type === "number" ? "0.001" : undefined}
        className={cn(
          "w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600",
          "focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors",
          mono && "font-mono"
        )}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
    </div>
  );
}
