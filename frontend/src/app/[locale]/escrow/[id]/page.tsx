"use client";

import { use, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther, createPublicClient, http } from "viem";
import { blockdagMainnet, getRpcUrl, DEFAULT_CHAIN_ID } from "@/lib/chains";
import { Nav } from "@/components/nav";
import { PageWrapper } from "@/components/page-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddressDisplay } from "@/components/ui/address-display";
import { AmountDisplay } from "@/components/ui/amount-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/toast";
import { useContractType } from "@/lib/hooks/useContractType";
import { useSimpleEscrowRead, useSimpleEscrowWrite } from "@/lib/hooks/useSimpleEscrow";
import { useMilestoneEscrowRead, useMilestoneEscrowWrite } from "@/lib/hooks/useMilestoneEscrow";
import { useEscrowEvents } from "@/lib/hooks/useEscrowEvents";
import { addViewedEscrow } from "@/lib/localStorage";
import { EXPLORER_TX_URL, SIMPLE_STATE_LABEL, MILESTONE_STATE_LABEL, SimpleEscrowState, MilestoneState, AI_ARBITER_ABI, SIMPLE_ESCROW_ABI } from "@/lib/contracts";
import { getArbiterAddress } from "@/lib/contracts/addresses";
import { cn } from "@/lib/utils";
import { ShareEscrow } from "@/components/share-escrow";
import { DownloadReceipt } from "@/components/download-receipt";
import type { ReceiptData } from "@/lib/generateReceipt";

type Address = `0x${string}`;

function isAddress(s: string): s is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

// ─── Role detection ───────────────────────────────────────────────────────────

type Role = "depositor" | "beneficiary" | "arbiter" | "observer";

function deriveRole(wallet: string | undefined, depositor: string | null, beneficiary: string | null, arbiter: string | null): Role {
  if (!wallet) return "observer";
  const w = wallet.toLowerCase();
  if (depositor?.toLowerCase()   === w) return "depositor";
  if (beneficiary?.toLowerCase() === w) return "beneficiary";
  if (arbiter?.toLowerCase()     === w) return "arbiter";
  return "observer";
}

const ROLE_BADGE: Record<Role, string> = {
  depositor:   "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  beneficiary: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  arbiter:     "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  observer:    "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

// ─── Simple contract view ─────────────────────────────────────────────────────

const rpcClient = createPublicClient({ chain: blockdagMainnet, transport: http(getRpcUrl(DEFAULT_CHAIN_ID)) });

function SimpleEscrowView({ address }: { address: Address }) {
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const data = useSimpleEscrowRead(address, chainId);
  const writes = useSimpleEscrowWrite(chainId);

  const role = deriveRole(wallet, data.depositor, data.beneficiary, data.arbiter);
  const stateNum = data.state ?? 0;
  const stateLabel = SIMPLE_STATE_LABEL[stateNum] ?? "Unknown";

  useEffect(() => {
    if (data.depositor) {
      addViewedEscrow({ address, type: "simple" });
    }
  }, [address, data.depositor]);

  async function doWrite(fn: () => Promise<`0x${string}`>, label: string) {
    const pid = addToast({ type: "pending", message: `${label}…` });
    try {
      const hash = await fn();
      addToast({ type: "pending", message: `Waiting for confirmation…`, txHash: hash });
      // Wait for receipt
      try {
        await rpcClient.waitForTransactionReceipt({ hash, timeout: 120_000, pollingInterval: 2_000 });
      } catch { /* timeout — still poll below */ }
      removeToast(pid);
      addToast({ type: "success", message: `${label} confirmed`, txHash: hash });
      // Poll contract state directly (bypasses wagmi cache) until it changes
      const stateBeforeWrite = data.state;
      let settled = false;
      for (let i = 0; i < 20 && !settled; i++) {
        await new Promise(r => setTimeout(r, 3_000));
        try {
          const fresh = await rpcClient.readContract({
            address, abi: SIMPLE_ESCROW_ABI,
            functionName: "state",
          });
          if (fresh !== stateBeforeWrite) {
            settled = true;
          }
        } catch { /* rpc hiccup, keep trying */ }
        // Invalidate wagmi cache so hooks re-fetch from chain
        queryClient.invalidateQueries();
        data.refetch();
      }
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Transaction failed" });
    }
  }

  if (data.isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">Simple Escrow</h1>
              <StatusBadge status={stateLabel} />
              <span className={cn("text-xs px-2 py-1 rounded-full border capitalize", ROLE_BADGE[role])}>
                You: {role}
              </span>
            </div>
            <AddressDisplay address={address} className="mt-2" />
          </div>
          {data.amount !== null && (
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 mb-1">Amount</p>
              <AmountDisplay amount={data.amount} size="lg" />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {([
            ["Depositor",   data.depositor],
            ["Beneficiary", data.beneficiary],
            ["Arbiter",     data.arbiter],
          ] as [string, string | null][]).map(([label, addr]) => (
            <div key={label} className="rounded-xl bg-white/3 border border-white/8 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
              {addr ? (
                <div>
                  <AddressDisplay address={addr} />
                  {label === "Arbiter" && arbiterAddress && addr.toLowerCase() === arbiterAddress.toLowerCase() && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-violet-300 bg-violet-400/10 border border-violet-400/20 rounded-full px-2 py-0.5">
                      🤖 AI Arbiter
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Evidence panel for AI arbiter disputes */}
      {stateNum === SimpleEscrowState.DISPUTED &&
        data.arbiter?.toLowerCase() === arbiterAddress?.toLowerCase() && (
        <EvidencePanel escrowAddress={address} isBuyer={!!wallet && data.depositor?.toLowerCase() === wallet.toLowerCase()} />
      )}

      {/* Actions */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Actions</h3>
        <div className="space-y-3">
          {role === "depositor" && stateNum === SimpleEscrowState.AWAITING_DELIVERY && (
            <>
              <ActionRow
                title="Release Funds"
                desc={`Send ${data.amount ? formatEther(data.amount) : "?"} BDAG to beneficiary`}
                action={<GlowButton variant="primary" loading={writes.isPending} onClick={() => doWrite(() => writes.release(address), "Release")}>Release</GlowButton>}
              />
              <ActionRow
                title="Raise Dispute"
                desc="Escalate to arbiter for resolution"
                action={<GlowButton variant="danger" loading={writes.isPending} onClick={() => doWrite(() => writes.dispute(address), "Dispute")}>Dispute</GlowButton>}
              />
            </>
          )}
          {role === "arbiter" && stateNum === SimpleEscrowState.DISPUTED && (
            <>
              <ActionRow
                title="Resolve — Release to Beneficiary"
                desc="Arbiter decision: funds go to beneficiary"
                action={<GlowButton variant="primary" loading={writes.isPending} onClick={() => doWrite(() => writes.resolveRelease(address), "Resolve Release")}>Resolve Release</GlowButton>}
              />
              <ActionRow
                title="Resolve — Refund Depositor"
                desc="Arbiter decision: funds returned to depositor"
                action={<GlowButton variant="secondary" loading={writes.isPending} onClick={() => doWrite(() => writes.resolveRefund(address), "Resolve Refund")}>Resolve Refund</GlowButton>}
              />
            </>
          )}
          {(stateNum === SimpleEscrowState.COMPLETE || stateNum === SimpleEscrowState.REFUNDED) && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-slate-500">Escrow is {stateLabel.toLowerCase()} — no actions available.</p>
              {stateNum === SimpleEscrowState.COMPLETE && (
                <DownloadReceipt data={{
                  escrowAddress: address,
                  escrowType: "simple",
                  depositor: data.depositor ?? "",
                  beneficiary: data.beneficiary ?? "",
                  arbiter: data.arbiter ?? "",
                  amount: data.amount ?? 0n,
                  isAIArbiter: data.arbiter?.toLowerCase() === arbiterAddress?.toLowerCase(),
                }} />
              )}
            </div>
          )}
          {(stateNum === SimpleEscrowState.AWAITING_PAYMENT) && (
            <p className="text-sm text-slate-500 py-4 text-center">Awaiting deposit.</p>
          )}
          {role === "observer" && stateNum === SimpleEscrowState.AWAITING_DELIVERY && (
            <p className="text-sm text-slate-500 py-4 text-center">Connect the depositor or arbiter wallet to take action.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Milestone contract view ──────────────────────────────────────────────────

function MilestoneEscrowView({ address }: { address: Address }) {
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const data = useMilestoneEscrowRead(address, chainId);
  const writes = useMilestoneEscrowWrite(chainId);

  const role = deriveRole(wallet, data.depositor, data.beneficiary, data.arbiter);
  const releasedCount = data.milestones.filter(m => m.state === MilestoneState.RELEASED).length;

  useEffect(() => {
    if (data.depositor) {
      addViewedEscrow({ address, type: "milestone" });
    }
  }, [address, data.depositor]);

  async function doWrite(fn: () => Promise<`0x${string}`>, label: string) {
    const pid = addToast({ type: "pending", message: `${label}…` });
    try {
      const hash = await fn();
      addToast({ type: "pending", message: `Waiting for confirmation…`, txHash: hash });
      try {
        await rpcClient.waitForTransactionReceipt({ hash, timeout: 120_000, pollingInterval: 2_000 });
      } catch { /* timeout — still poll below */ }
      removeToast(pid);
      addToast({ type: "success", message: `${label} confirmed`, txHash: hash });
      // Invalidate wagmi cache + keep polling until state is fresh
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3_000));
        queryClient.invalidateQueries();
        data.refetch();
      }
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Transaction failed" });
    }
  }

  if (data.isLoading) return <LoadingState />;

  const progress = data.milestoneCount > 0 ? (releasedCount / data.milestoneCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">Milestone Escrow</h1>
              <StatusBadge status={data.funded ? "active" : "awaiting_payment"} />
              <span className={cn("text-xs px-2 py-1 rounded-full border capitalize", ROLE_BADGE[role])}>
                You: {role}
              </span>
            </div>
            <AddressDisplay address={address} className="mt-2" />
          </div>
          {data.totalDeposited !== null && (
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 mb-1">Total</p>
              <AmountDisplay amount={data.totalDeposited} size="lg" />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {([
            ["Depositor",   data.depositor],
            ["Beneficiary", data.beneficiary],
            ["Arbiter",     data.arbiter],
          ] as [string, string | null][]).map(([label, addr]) => (
            <div key={label} className="rounded-xl bg-white/3 border border-white/8 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
              {addr ? <AddressDisplay address={addr} /> : <span className="text-xs text-slate-600">—</span>}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Milestones */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Milestones ({releasedCount}/{data.milestoneCount})
          </h3>
        </div>
        <Progress value={progress} className="h-2 bg-white/5 mb-5" />

        <div className="space-y-3">
          {data.milestones.map((ms, i) => {
            const msLabel = MILESTONE_STATE_LABEL[ms.state] ?? "unknown";
            return (
              <div key={i} className="rounded-xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-mono text-slate-400 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{ms.description}</p>
                  <AmountDisplay amount={ms.amount} size="sm" className="mt-0.5" />
                </div>
                <StatusBadge status={msLabel} />
                {role === "depositor" && ms.state === MilestoneState.PENDING && (
                  <div className="flex gap-2 shrink-0">
                    <GlowButton variant="secondary" className="h-7 px-3 text-xs" onClick={() => doWrite(() => writes.releaseMilestone(address, BigInt(i)), `Release M${i+1}`)}>
                      Release
                    </GlowButton>
                    <GlowButton variant="danger" className="h-7 px-3 text-xs" onClick={() => doWrite(() => writes.disputeMilestone(address, BigInt(i)), `Dispute M${i+1}`)}>
                      Dispute
                    </GlowButton>
                  </div>
                )}
                {role === "arbiter" && ms.state === MilestoneState.DISPUTED && (
                  <div className="flex gap-2 shrink-0">
                    <GlowButton variant="primary" className="h-7 px-3 text-xs" onClick={() => doWrite(() => writes.resolveRelease(address, BigInt(i)), `Resolve M${i+1}`)}>
                      Release
                    </GlowButton>
                    <GlowButton variant="secondary" className="h-7 px-3 text-xs" onClick={() => doWrite(() => writes.resolveRefund(address, BigInt(i)), `Refund M${i+1}`)}>
                      Refund
                    </GlowButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {data.milestones.length > 0 && data.milestones.every(m => m.state === MilestoneState.RELEASED) && (
          <div className="mt-4 pt-4 border-t border-white/8 flex justify-center">
            <DownloadReceipt data={{
              escrowAddress: address,
              escrowType: "milestone",
              depositor: data.depositor ?? "",
              beneficiary: data.beneficiary ?? "",
              arbiter: data.arbiter ?? "",
              amount: data.totalDeposited ?? 0n,
              milestones: data.milestones,
            }} />
          </div>
        )}
        {!data.funded && role === "depositor" && data.totalDeposited !== null && (
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Fund contract to activate milestones</p>
              <GlowButton
                variant="primary"
                onClick={() => doWrite(() => writes.fund(address, data.totalDeposited!), "Fund")}
              >
                Fund <AmountDisplay amount={data.totalDeposited} size="sm" className="ml-1" />
              </GlowButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Loading / unknown states ─────────────────────────────────────────────────

function LoadingState() {
  return (
    <GlassCard className="p-12 text-center">
      <div className="inline-flex items-center gap-3 text-slate-400">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading contract data…
      </div>
    </GlassCard>
  );
}

function ActionRow({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/3 border border-white/8 p-4">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      {action}
    </div>
  );
}

// ─── Evidence panel (shown when AI Arbiter + disputed) ────────────────────────

// ─── Intake form state ────────────────────────────────────────────────────────

type IntakeForm = {
  agreementSummary: string;
  deadlineImportant: boolean;
  deadlineReason: string;
  actionsTimeline: string;
  counterpartyTimeline: string;
  deliveryClaim: "none" | "partial" | "complete" | "";
  buyerUseClaim?: "yes" | "no" | "unsure" | "";  // seller only
  evidence: string;
  firstComplaintTime: string;
  complaintEvidence: string;
  requestedOutcome: "refund" | "release" | "other" | "";
  requestedOutcomeReason: string;
};

const EMPTY_INTAKE: IntakeForm = {
  agreementSummary: "", deadlineImportant: false, deadlineReason: "",
  actionsTimeline: "", counterpartyTimeline: "", deliveryClaim: "",
  buyerUseClaim: "", evidence: "", firstComplaintTime: "",
  complaintEvidence: "", requestedOutcome: "", requestedOutcomeReason: "",
};

function EvidencePanel({ escrowAddress, isBuyer }: { escrowAddress: Address; isBuyer: boolean }) {
  const [step, setStep] = useState<"intake" | "freeform" | "done">("intake");
  const [form, setForm] = useState<IntakeForm>(EMPTY_INTAKE);
  const [freeformText, setFreeformText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast, removeToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);
  if (!arbiterAddress) return null;

  const role = isBuyer ? "buyer" : "seller";
  const set = (k: keyof IntakeForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // Validate required intake fields
  const intakeValid =
    form.agreementSummary.trim().length > 20 &&
    form.actionsTimeline.trim().length > 10 &&
    form.counterpartyTimeline.trim().length > 10 &&
    form.deliveryClaim !== "" &&
    form.requestedOutcome !== "" &&
    form.requestedOutcomeReason.trim().length > 10;

  async function submitIntake() {
    if (!intakeValid) return;
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting your statement…" });
    try {
      const payload = {
        role,
        agreementSummary: form.agreementSummary.trim(),
        deadlineImportant: form.deadlineImportant,
        deadlineReason: form.deadlineReason.trim(),
        actionsTimeline: form.actionsTimeline.trim(),
        counterpartyTimeline: form.counterpartyTimeline.trim(),
        deliveryClaim: form.deliveryClaim,
        ...(role === "seller" ? { buyerUseClaim: form.buyerUseClaim } : {}),
        evidence: form.evidence.trim().split(/\n+/).filter(Boolean),
        firstComplaintTime: form.firstComplaintTime.trim(),
        complaintEvidence: form.complaintEvidence.trim().split(/\n+/).filter(Boolean),
        requestedOutcome: form.requestedOutcome,
        requestedOutcomeReason: form.requestedOutcomeReason.trim(),
      };
      const uri = "INTAKE_JSON:" + JSON.stringify(payload);
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, uri],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Statement submitted on-chain ✓", txHash: hash });
      setStep("freeform");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFreeform() {
    if (!freeformText.trim()) { setStep("done"); return; }
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting additional evidence…" });
    try {
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, freeformText.trim()],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Evidence submitted on-chain ✓", txHash: hash });
      setStep("done");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-xl bg-white/5 border border-violet-400/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 transition-colors";
  const labelCls = "block text-xs font-medium text-violet-300 mb-1.5";
  const hintCls  = "text-xs text-slate-500 mt-1";
  const selectCls = inputCls + " cursor-pointer bg-[#1a1a2e]";

  // ── Done state ──────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 text-emerald-400">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-sm">Your submission is complete</p>
            <p className="text-xs text-slate-400 mt-0.5">The AI arbiter has your statement and will evaluate the dispute shortly. You may still submit additional evidence above if new information becomes available.</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  // ── Freeform step ───────────────────────────────────────────────────────────
  if (step === "freeform") {
    return (
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📎</span>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">Additional Evidence (optional)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Your main statement has been submitted. If you have supporting links, file hashes, IPFS URIs, or screenshots, add them here. One item per line.
        </p>
        <textarea
          className={inputCls + " resize-none"}
          rows={4}
          placeholder={"e.g.\nhttps://github.com/project/repo/commit/abc123\nipfs://QmDeliveryProof...\nhttps://screenshot-url.com/img.png"}
          value={freeformText}
          onChange={e => setFreeformText(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">Optional — skip if you have nothing to add</p>
          <div className="flex gap-2">
            <GlowButton variant="secondary" onClick={() => setStep("done")}
              className="px-4 border-slate-400/20 text-slate-400 text-xs">
              Skip
            </GlowButton>
            <GlowButton variant="secondary" loading={submitting} onClick={submitFreeform}
              disabled={!freeformText.trim()}
              className="px-6 border-violet-400/30 text-violet-300">
              Submit Evidence
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  // ── Intake questionnaire ────────────────────────────────────────────────────
  return (
    <GlassCard className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">AI Arbiter — Your Statement</h3>
          <p className="text-xs text-slate-400 mt-0.5">Answer these questions so the AI arbiter can evaluate your case fairly. Take your time — there are no wrong answers, just be honest.</p>
        </div>
      </div>

      {/* Q1 — Agreement */}
      <div>
        <label className={labelCls}>1. What did you and the {isBuyer ? "seller" : "buyer"} agree to? *</label>
        <p className={hintCls + " mb-2"}>In your own words — what was supposed to be delivered, for how much, and by when?</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder="e.g. We agreed on a full website redesign — 8 pages, mobile-friendly, delivered by March 15th for 0.5 ETH."
          value={form.agreementSummary} onChange={e => set("agreementSummary", e.target.value)} />
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={form.deadlineImportant}
              onChange={e => set("deadlineImportant", e.target.checked)}
              className="rounded accent-violet-500" />
            Was the deadline especially important? (e.g. you had a launch or event depending on it)
          </label>
        </div>
        {form.deadlineImportant && (
          <input className={inputCls + " mt-2 text-sm"} type="text"
            placeholder="Why was the deadline critical? e.g. We had a conference on March 20th."
            value={form.deadlineReason} onChange={e => set("deadlineReason", e.target.value)} />
        )}
      </div>

      {/* Q2 — Your actions */}
      <div>
        <label className={labelCls}>2. What did you do in this deal? *</label>
        <p className={hintCls + " mb-2"}>
          {isBuyer
            ? "When did you pay? Did you give the seller everything they needed (files, access, feedback)?"
            : "What did you deliver, and when? Describe what you actually did step by step."}
        </p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={isBuyer
            ? "e.g. I funded the escrow on March 1st. I sent the brand guide on March 3rd and answered all their questions."
            : "e.g. I started work on March 2nd. Delivered a draft on March 10th, final version on March 14th via Google Drive link."}
          value={form.actionsTimeline} onChange={e => set("actionsTimeline", e.target.value)} />
      </div>

      {/* Q3 — Other party's actions */}
      <div>
        <label className={labelCls}>3. What did the {isBuyer ? "seller" : "buyer"} do — or fail to do? *</label>
        <p className={hintCls + " mb-2"}>Be specific about what happened. When did things go wrong?</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={isBuyer
            ? "e.g. They delivered something on March 16th but it was only 3 pages, not 8. They stopped responding on March 18th."
            : "e.g. The buyer never sent the brand guide I asked for on March 4th and March 8th. They approved the draft on March 11th then changed requirements on March 15th."}
          value={form.counterpartyTimeline} onChange={e => set("counterpartyTimeline", e.target.value)} />
      </div>

      {/* Q3b — Delivery claim */}
      <div>
        <label className={labelCls}>
          {isBuyer ? "Did the seller deliver anything?" : "How much of the agreed work did you deliver?"} *
        </label>
        <select className={selectCls} value={form.deliveryClaim}
          onChange={e => set("deliveryClaim", e.target.value as IntakeForm["deliveryClaim"])}>
          <option value="">— Select —</option>
          <option value="none">Nothing was delivered</option>
          <option value="partial">Some of it was delivered, but not everything</option>
          <option value="complete">Everything agreed was delivered</option>
        </select>

        {/* Seller only: did buyer use the work? */}
        {!isBuyer && (
          <div className="mt-3">
            <label className={labelCls}>Did the buyer use or benefit from what you delivered?</label>
            <select className={selectCls} value={form.buyerUseClaim ?? ""}
              onChange={e => set("buyerUseClaim", e.target.value)}>
              <option value="">— Select —</option>
              <option value="yes">Yes — they used it, deployed it, or benefited from it</option>
              <option value="no">No — as far as I know they haven&apos;t used it</option>
              <option value="unsure">I&apos;m not sure</option>
            </select>
          </div>
        )}
      </div>

      {/* Q4 — Evidence */}
      <div>
        <label className={labelCls}>4. What evidence can you share?</label>
        <p className={hintCls + " mb-2"}>Links, file hashes, screenshots hosted somewhere, GitHub repos, live URLs — one per line. Don&apos;t worry if you don&apos;t have much.</p>
        <textarea className={inputCls + " resize-none"} rows={3}
          placeholder={"e.g.\nhttps://github.com/myproject/repo\nhttps://imgur.com/screenshot.png\nipfs://QmDeliveryProof..."}
          value={form.evidence} onChange={e => set("evidence", e.target.value)} />
      </div>

      {/* Q5 — Complaint timing */}
      <div>
        <label className={labelCls}>5. When did {isBuyer ? "you first raise a problem with the seller" : "the buyer first complain, if at all"}?</label>
        <p className={hintCls + " mb-2"}>
          {isBuyer
            ? "If you had concerns, when did you first tell the seller? (approximate date is fine)"
            : "If the buyer complained, when was that? If they never complained, say so."}
        </p>
        <input className={inputCls} type="text"
          placeholder={isBuyer ? "e.g. March 16th — I messaged them saying the pages were missing." : "e.g. They never complained until after I requested payment on March 20th."}
          value={form.firstComplaintTime} onChange={e => set("firstComplaintTime", e.target.value)} />
        <input className={inputCls + " mt-2"} type="text"
          placeholder="Any proof of that conversation? (link or description)"
          value={form.complaintEvidence} onChange={e => set("complaintEvidence", e.target.value)} />
      </div>

      {/* Q6 — Requested outcome */}
      <div>
        <label className={labelCls}>6. What outcome do you believe is fair? *</label>
        <select className={selectCls} value={form.requestedOutcome}
          onChange={e => set("requestedOutcome", e.target.value as IntakeForm["requestedOutcome"])}>
          <option value="">— Select —</option>
          <option value="refund">Full refund to the buyer</option>
          <option value="release">Full payment released to the seller</option>
          <option value="other">Something else (explain below)</option>
        </select>
        <textarea className={inputCls + " resize-none mt-2"} rows={2}
          placeholder="Explain why you think this is fair…"
          value={form.requestedOutcomeReason} onChange={e => set("requestedOutcomeReason", e.target.value)} />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <p className="text-xs text-slate-500">* Required fields. Your answers are stored permanently on-chain.</p>
        <GlowButton variant="secondary" loading={submitting} onClick={submitIntake}
          disabled={!intakeValid}
          className="px-8 border-violet-400/30 text-violet-300 hover:border-violet-400/60">
          Submit Statement →
        </GlowButton>
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EscrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const chainId = useChainId();
  const contractType = useContractType(isAddress(id) ? id : undefined, chainId);
  const { events } = useEscrowEvents(isAddress(id) ? id : undefined, contractType, chainId);

  if (!isAddress(id)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Nav />
        <main className="mx-auto max-w-3xl w-full px-4 py-16 text-center">
          <p className="text-slate-400">Invalid contract address</p>
          <Link href="/dashboard" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">← Dashboard</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <PageWrapper>
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="font-mono text-slate-300">{id.slice(0, 10)}…</span>
            </div>

            {/* Contract view */}
            {contractType === "unknown" && <LoadingState />}
            {contractType === "simple" && <SimpleEscrowView address={id} />}
            {contractType === "milestone" && <MilestoneEscrowView address={id} />}

            {/* Share */}
            <ShareEscrow address={id} />

            {/* Event log */}
            {events.length > 0 && (
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Event Log</h3>
                <div className="space-y-2">
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      <span className="text-cyan-400 font-medium">{ev.name}</span>
                      {ev.transactionHash && (
                        <a href={EXPLORER_TX_URL(ev.transactionHash)} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-slate-500 hover:text-cyan-400 transition-colors truncate">
                          {ev.transactionHash.slice(0, 14)}…
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
