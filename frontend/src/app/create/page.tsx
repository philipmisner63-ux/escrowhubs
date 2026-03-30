"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EscrowType = "simple" | "milestone";

interface MilestoneInput {
  description: string;
  amount: string;
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const [type, setType] = useState<EscrowType>("simple");
  const [form, setForm] = useState({
    title: "",
    beneficiary: "",
    arbiter: "",
    amount: "",
  });
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function addMilestone() {
    setMilestones(m => [...m, { description: "", amount: "" }]);
  }

  function removeMilestone(i: number) {
    setMilestones(m => m.filter((_, idx) => idx !== i));
  }

  function updateMilestone(i: number, field: keyof MilestoneInput, value: string) {
    setMilestones(m => m.map((ms, idx) => idx === i ? { ...ms, [field]: value } : ms));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: wire up contract deployment
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Create Escrow</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deploy a new escrow contract on BlockDAG
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-4">
        {(["simple", "milestone"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "relative rounded-xl border p-5 text-left transition-all duration-200",
              type === t
                ? "border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_30px_rgba(0,245,255,0.1)]"
                : "glass border-white/8 hover:border-white/16"
            )}
          >
            {type === t && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
            )}
            <div className="text-2xl mb-2">{t === "simple" ? "⬡" : "◈"}</div>
            <h3 className="font-semibold text-white capitalize">{t} Escrow</h3>
            <p className="mt-1 text-xs text-slate-400">
              {t === "simple"
                ? "Single-release escrow. Funds released on delivery or arbiter decision."
                : "Phased escrow with per-milestone releases. Ideal for complex projects."}
            </p>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass rounded-xl border border-white/8 p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Title</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
            placeholder="e.g. Smart Contract Audit"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Beneficiary Address</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
            placeholder="0x..."
            value={form.beneficiary}
            onChange={e => setForm(f => ({ ...f, beneficiary: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Arbiter Address</label>
          <input
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
            placeholder="0x..."
            value={form.arbiter}
            onChange={e => setForm(f => ({ ...f, arbiter: e.target.value }))}
            required
          />
        </div>

        {type === "simple" ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Amount (BDAG)</label>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
              placeholder="0.0"
              type="number"
              step="0.001"
              min="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Milestones</label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                + Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((ms, i) => (
                <div key={i} className="relative flex gap-3 items-start rounded-lg bg-white/3 border border-white/8 p-3">
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
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Total</span>
              <span className="text-cyan-400 font-semibold">
                {milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(3)} BDAG
              </span>
            </div>
          </div>
        )}

        {/* Trust score indicator */}
        <div className="rounded-lg bg-white/3 border border-white/8 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Adaptive Verification</p>
            <p className="text-xs text-slate-600 mt-0.5">Based on trust score + transaction size</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Est. verification tier</span>
            <p className="text-sm font-semibold text-cyan-400">Standard</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-cyan-400 text-black hover:bg-cyan-300 font-semibold shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] disabled:opacity-50 transition-all"
        >
          {submitting ? "Deploying Contract…" : "Deploy Escrow Contract"}
        </Button>
      </form>
    </div>
  );
}
