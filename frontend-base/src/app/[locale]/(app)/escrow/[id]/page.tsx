"use client";

import { use, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther, createPublicClient, http } from "viem";
import { SUPPORTED_CHAINS, getRpcUrl } from "@/lib/chains";
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
import { triggerDeployConfetti } from "@/lib/confetti";

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



function SimpleEscrowView({ address }: { address: Address }) {
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);
  const { addToast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const activeChain = SUPPORTED_CHAINS.find(c => c.id === chainId) ?? SUPPORTED_CHAINS[0];
  const rpcClient = createPublicClient({ chain: activeChain, transport: http(getRpcUrl(activeChain.id)) });
  const data = useSimpleEscrowRead(address, chainId);
  const writes = useSimpleEscrowWrite(chainId);

  const [role, setRole] = useState<Role>("observer");
  const [stateNum, setStateNum] = useState<number | null>(null);

  useEffect(() => {
    if (!data.depositor) return; // don't update until data is loaded
    setRole(deriveRole(wallet, data.depositor, data.beneficiary, data.arbiter));
  }, [wallet, data.depositor, data.beneficiary, data.arbiter]);

  useEffect(() => {
    if (data.state !== null && data.state !== undefined) {
      setStateNum(data.state);
      if (data.state === SimpleEscrowState.COMPLETE) triggerDeployConfetti();
    }
  }, [data.state]);

  const stateLabel = stateNum !== null ? (SIMPLE_STATE_LABEL[stateNum] ?? "Unknown") : "Loading…";

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
              <AmountDisplay amount={data.amount} size="lg" symbol={activeChain.nativeCurrency.symbol} />
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
        <EvidencePanel escrowAddress={address} />
      )}

      {/* Actions */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Actions</h3>
        <div className="space-y-3">
          {stateNum === null && (
            <p className="text-sm text-slate-500 py-4 text-center animate-pulse">Loading contract data…</p>
          )}
          {role === "depositor" && stateNum === SimpleEscrowState.AWAITING_DELIVERY && (
            <>
              <ActionRow
                title="Release Funds"
                desc={`Send ${data.amount ? formatEther(data.amount) : "?"} ETH to beneficiary`}
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
                  chainId,
                }} />
              )}
            </div>
          )}
          {stateNum === SimpleEscrowState.AWAITING_PAYMENT && (
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
  const activeChain = SUPPORTED_CHAINS.find(c => c.id === chainId) ?? SUPPORTED_CHAINS[0];
  const rpcClient = createPublicClient({ chain: activeChain, transport: http(getRpcUrl(activeChain.id)) });
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
              <AmountDisplay amount={data.totalDeposited} size="lg" symbol={activeChain.nativeCurrency.symbol} />
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

function EvidencePanel({ escrowAddress }: { escrowAddress: Address }) {
  const [evidenceText, setEvidenceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast, removeToast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const arbiterAddress = getArbiterAddress(chainId);

  const isAIArbiter = !!arbiterAddress;

  async function submitEvidence() {
    if (!evidenceText.trim()) return;
    setSubmitting(true);
    const pid = addToast({ type: "pending", message: "Submitting evidence…" });
    try {
      const hash = await writeContractAsync({
        address: arbiterAddress,
        abi: AI_ARBITER_ABI,
        functionName: "submitEvidence",
        args: [escrowAddress, evidenceText.trim()],
      });
      removeToast(pid);
      addToast({ type: "success", message: "Evidence submitted on-chain", txHash: hash });
      setEvidenceText("");
    } catch (e: unknown) {
      removeToast(pid);
      addToast({ type: "error", message: e instanceof Error ? e.message.slice(0, 120) : "Failed to submit" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAIArbiter) return null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">AI Arbiter — Submit Evidence</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        The AI oracle is monitoring this dispute. Submit your evidence below — it will be stored on-chain
        and reviewed by the AI arbiter. Be clear and factual. Include links, transaction hashes, or
        screenshots (as IPFS URIs) if available.
      </p>
      <textarea
        className="w-full rounded-xl bg-white/5 border border-violet-400/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 transition-colors resize-none"
        rows={4}
        placeholder="Describe your case… e.g. 'Work was not delivered by the agreed deadline. See transaction 0x... and messages at ipfs://...'"
        value={evidenceText}
        onChange={e => setEvidenceText(e.target.value)}
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-500">Evidence is permanently stored on-chain</p>
        <GlowButton
          variant="secondary"
          loading={submitting}
          onClick={submitEvidence}
          disabled={!evidenceText.trim()}
          className="px-6 border-violet-400/30 text-violet-300 hover:border-violet-400/60"
        >
          Submit Evidence
        </GlowButton>
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EscrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  // Normalize to lowercase — Next.js/next-intl may transform the URL segment
  const id = rawId?.toLowerCase() as string;
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
