"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther, decodeEventLog } from "viem";
import { usePublicClient, useWriteContract } from "wagmi";
import { Nav } from "@/components/nav";
import { PageWrapper } from "@/components/page-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";
import { triggerDeployConfetti } from "@/lib/confetti";
import {
  ESCROW_FACTORY_ABI,
  FACTORY_ADDRESS,
  EXPLORER_TX_URL,
  AI_ARBITER_ADDRESS,
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
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [type, setType] = useState<EscrowType>("simple");
  const [form, setForm] = useState({ title: "", beneficiary: "", arbiter: "", amount: "" });
  const [milestones, setMilestones] = useState<MilestoneInput[]>([{ description: "", amount: "" }]);
  const [useAIArbiter, setUseAIArbiter] = useState(false);
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
      const resolvedArbiter = useAIArbiter
        ? AI_ARBITER_ADDRESS
        : form.arbiter as `0x${string}`;

      let txHash: `0x${string}`;

      if (type === "simple") {
        const escrowAmount = parseEther(form.amount);
        const protocolFee = escrowAmount * 50n / 10000n;
        const aiArbiterFee = useAIArbiter ? parseEther("1") : 0n;
        const totalValue = escrowAmount + protocolFee + aiArbiterFee;

        txHash = await writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: ESCROW_FACTORY_ABI,
          functionName: "createSimpleEscrow",
          args: [form.beneficiary as `0x${string}`, resolvedArbiter, 0, useAIArbiter],
          value: totalValue,
        });
      } else {
        const descriptions = milestones.map(m => m.description);
        const amounts = milestones.map(m => parseEther(m.amount));
        const netTotal = amounts.reduce((a, b) => a + b, 0n);
        const protocolFee = netTotal * 50n / 10000n;
        const aiArbiterFee = useAIArbiter ? parseEther("1") : 0n;
        const totalValue = netTotal + protocolFee + aiArbiterFee;

        txHash = await writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: ESCROW_FACTORY_ABI,
          functionName: "createMilestoneEscrow",
          args: [form.beneficiary as `0x${string}`, resolvedArbiter, descriptions, amounts, 0, useAIArbiter],
          value: totalValue,
        });
      }

      // Extract escrow contract address from transaction receipt events
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      let contractAddress: `0x${string}` = txHash;

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ESCROW_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "SimpleEscrowCreated" || decoded.eventName === "MilestoneEscrowCreated") {
            contractAddress = (decoded.args as { contractAddress: `0x${string}` }).contractAddress;
            break;
          }
        } catch { /* skip non-matching logs */ }
      }

      // Fallback: read latest escrow from factory if event decode failed
      if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
        try {
          const count = await publicClient!.readContract({
            address: FACTORY_ADDRESS,
            abi: ESCROW_FACTORY_ABI,
            functionName: "escrowCount",
          }) as bigint;
          if (count > 0n) {
            const record = await publicClient!.readContract({
              address: FACTORY_ADDRESS,
              abi: [{ type: "function", name: "escrows", inputs: [{ type: "uint256" }], outputs: [{ name: "contractAddress", type: "address" }], stateMutability: "view" }],
              functionName: "escrows",
              args: [count - 1n],
            }) as { contractAddress: `0x${string}` };
            if (record.contractAddress) contractAddress = record.contractAddress;
          }
        } catch { /* redirect to dashboard as last resort */ }
      }

      removeToast(pendingId);
      addToast({
        type: "success",
        message: "Escrow deployed!",
        txHash,
      });

      triggerDeployConfetti();
      // Only redirect to escrow page if we have a valid contract address (42 chars)
      const destination = /^0x[0-9a-fA-F]{40}$/.test(contractAddress)
        ? `/escrow/${contractAddress}`
        : `/dashboard`;
      setTimeout(() => router.push(destination), 500);

    } catch (err: unknown) {
      removeToast(pendingId);
      const msg = err instanceof Error ? err.message : "Deployment failed";
      addToast({ type: "error", message: msg.slice(0, 120) });
      setSubmitting(false);
    }
  }

  const milestoneTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  // Fee preview (client-side approximation matching contract logic)
  const PROTOCOL_FEE_BPS = 50; // 0.5%
  const AI_ARBITER_FLAT  = 1;  // 1 BDAG
  const escrowNet = type === "simple"
    ? parseFloat(form.amount) || 0
    : milestoneTotal;
  const protocolFee = escrowNet * PROTOCOL_FEE_BPS / 10_000;
  const aiArbiterFee = useAIArbiter ? AI_ARBITER_FLAT : 0;
  const totalFee = protocolFee + aiArbiterFee;
  const totalSend = escrowNet + totalFee;

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
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs text-cyan-300">
              <strong>BlockDAG Mainnet.</strong> Connect your wallet to BlockDAG (Chain ID: 1404, RPC: https://rpc.bdagscan.com) before deploying.
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
                {/* Arbiter selector */}
                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-widest text-slate-500">Arbiter</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUseAIArbiter(false)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all duration-200",
                        !useAIArbiter
                          ? "border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_20px_rgba(0,245,255,0.08)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      {!useAIArbiter && (
                        <div className="float-right h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
                      )}
                      <div className="text-lg mb-1">👤</div>
                      <p className="text-xs font-semibold text-white">Manual Arbiter</p>
                      <p className="text-xs text-slate-500 mt-0.5">Paste any wallet address</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAIArbiter(true)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all duration-200",
                        useAIArbiter
                          ? "border-violet-400/40 bg-violet-400/5 shadow-[0_0_20px_rgba(167,139,250,0.1)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      {useAIArbiter && (
                        <div className="float-right h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                      )}
                      <div className="text-lg mb-1">🤖</div>
                      <p className="text-xs font-semibold text-white">AI Arbiter</p>
                      <p className="text-xs text-slate-500 mt-0.5">Automated dispute resolution</p>
                    </button>
                  </div>

                  {useAIArbiter ? (
                    <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 text-xs text-violet-300 space-y-1">
                      <p className="font-semibold">🤖 AI Arbiter enabled</p>
                      <p className="text-violet-400/70">Disputes are resolved automatically by an AI oracle. Both parties submit evidence on-chain; the AI reviews and executes the decision.</p>
                      {AI_ARBITER_ADDRESS ? (
                        <p className="font-mono text-violet-400/50 break-all">{AI_ARBITER_ADDRESS}</p>
                      ) : (
                        <p className="text-yellow-400/70">⚠ AI Arbiter contract not yet deployed — set <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_AI_ARBITER_ADDRESS</code> in .env</p>
                      )}
                    </div>
                  ) : (
                    <Field label="" value={form.arbiter} onChange={v => setForm(f => ({ ...f, arbiter: v }))} placeholder="0x arbiter address..." mono />
                  )}
                </div>

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

                {/* Fee preview */}
                {escrowNet > 0 && (
                  <div className={cn(
                    "rounded-xl border p-4 space-y-2 text-xs",
                    useAIArbiter
                      ? "border-violet-400/20 bg-violet-400/5"
                      : "border-white/8 bg-white/3"
                  )}>
                    <p className={cn(
                      "font-semibold uppercase tracking-widest",
                      useAIArbiter ? "text-violet-300" : "text-slate-400"
                    )}>
                      Fee Breakdown
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Escrow amount</span>
                        <span className="font-mono">{escrowNet.toFixed(4)} BDAG</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Protocol fee (0.5%)</span>
                        <span className="font-mono">+{protocolFee.toFixed(4)} BDAG</span>
                      </div>
                      {useAIArbiter && (
                        <div className="flex justify-between text-violet-400">
                          <span>🤖 AI Arbiter fee</span>
                          <span className="font-mono">+{aiArbiterFee.toFixed(4)} BDAG</span>
                        </div>
                      )}
                      <div className={cn(
                        "flex justify-between font-semibold pt-1 border-t",
                        useAIArbiter ? "border-violet-400/20 text-violet-300" : "border-white/8 text-white"
                      )}>
                        <span>Total to send</span>
                        <span className="font-mono">{totalSend.toFixed(4)} BDAG</span>
                      </div>
                    </div>
                  </div>
                )}

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
