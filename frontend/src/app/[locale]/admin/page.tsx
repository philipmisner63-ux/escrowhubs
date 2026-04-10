"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { formatEther, parseEther, isAddress } from "viem";
import { Nav } from "@/components/nav";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { AddressDisplay } from "@/components/ui/address-display";
import { ESCROW_FACTORY_ABI, EXPLORER_TX_URL } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";

const OWNER_ADDRESS = "0x202eBD8c160BF77Eb026406c7C2BA2602E974EaA";

// ─── Admin fee functions not in the shared ABI — extend locally ───────────────
const ADMIN_ABI = [
  { type: "function", name: "accumulatedFees",  inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "protocolFeeBps",   inputs: [], outputs: [{ type: "uint16"  }], stateMutability: "view" },
  { type: "function", name: "aiArbiterFee",     inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "treasury",         inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "owner",            inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "withdrawFees",     inputs: [], outputs: [],                    stateMutability: "nonpayable" },
  { type: "function", name: "setFees",          inputs: [{ name: "_protocolFeeBps", type: "uint16" }, { name: "_aiArbiterFee", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setTreasury",      inputs: [{ name: "_treasury", type: "address" }], outputs: [], stateMutability: "nonpayable" },
] as const;



function TxStatus({ hash }: { hash?: `0x${string}` }) {
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (!hash) return null;
  if (isLoading) return <p className="text-xs text-yellow-400 mt-2 animate-pulse">⏳ Confirming…</p>;
  if (isSuccess) return (
    <p className="text-xs text-green-400 mt-2">
      ✅ Confirmed!{" "}
      <a href={EXPLORER_TX_URL(hash)} target="_blank" rel="noopener noreferrer" className="underline opacity-70 hover:opacity-100">
        View on explorer
      </a>
    </p>
  );
  return null;
}

export default function AdminPage() {
  const { address: wallet, isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const contract      = { address: factoryAddress, abi: ESCROW_FACTORY_ABI, chainId } as const;
  const adminContract = { address: factoryAddress, abi: ADMIN_ABI,          chainId } as const;

  // Fee form state
  const [feeBps, setFeeBps]         = useState("");
  const [arbiterFee, setArbiterFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");

  const { writeContractAsync } = useWriteContract();
  const [withdrawHash,  setWithdrawHash]  = useState<`0x${string}` | undefined>();
  const [setFeesHash,   setSetFeesHash]   = useState<`0x${string}` | undefined>();
  const [setTreasuryHash, setSetTreasuryHash] = useState<`0x${string}` | undefined>();
  const [txError, setTxError] = useState("");

  // Escalation queue
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loadingEsc, setLoadingEsc] = useState(false);
  const [selectedEsc, setSelectedEsc] = useState<any | null>(null);
  const [review, setReview] = useState("");
  const [arbiterRuling, setArbiterRuling] = useState<"RELEASE"|"REFUND"|"">("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);

  async function loadEscalations() {
    setLoadingEsc(true);
    try {
      const res = await fetch("/api/admin/escalations");
      if (res.ok) { const data = await res.json(); setEscalations(data.escalations ?? []); }
    } catch { /* ignore */ }
    setLoadingEsc(false);
  }

  async function submitReview() {
    if (!selectedEsc || !review.trim()) return;
    setSubmittingReview(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/admin/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowAddress: selectedEsc.contractAddress, chainId: selectedEsc.chainId ?? 8453, review: review.trim(), arbiterRuling }),
      });
      const data = await res.json();
      if (res.ok) { setReviewResult("Review submitted. Tx: " + data.txHash); setReview(""); setArbiterRuling(""); await loadEscalations(); }
      else setReviewResult("Error: " + data.error);
    } catch (err: any) { setReviewResult("Error: " + err.message); }
    setSubmittingReview(false);
  }

  const isOwner = isConnected && wallet?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const { data, refetch } = useReadContracts({
    contracts: [
      { ...adminContract, functionName: "accumulatedFees" },
      { ...adminContract, functionName: "protocolFeeBps"  },
      { ...adminContract, functionName: "aiArbiterFee"    },
      { ...adminContract, functionName: "treasury"        },
      { ...adminContract, functionName: "owner"           },
      { ...contract,      functionName: "escrowCount"     },
    ],
    query: { refetchInterval: 10_000 },
  });

  const accumulatedFees = (data?.[0]?.result as bigint | undefined) ?? 0n;
  const protocolFeeBps  = (data?.[1]?.result as number | undefined) ?? 0;
  const aiArbiterFee    = (data?.[2]?.result as bigint | undefined) ?? 0n;
  const treasury        = (data?.[3]?.result as `0x${string}` | undefined);
  const owner           = (data?.[4]?.result as `0x${string}` | undefined);
  const escrowCount     = (data?.[5]?.result as bigint | undefined) ?? 0n;

  const handleWithdraw = async () => {
    setTxError("");
    try {
      const hash = await writeContractAsync({ ...adminContract, functionName: "withdrawFees" });
      setWithdrawHash(hash);
      refetch();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleSetFees = async () => {
    setTxError("");
    const bps = parseInt(feeBps);
    if (isNaN(bps) || bps < 0 || bps > 500) { setTxError("Protocol fee must be 0–500 bps (0–5%)"); return; }
    if (!arbiterFee || isNaN(parseFloat(arbiterFee))) { setTxError("Invalid AI arbiter fee"); return; }
    try {
      const hash = await writeContractAsync({
        ...adminContract,
        functionName: "setFees",
        args: [bps, parseEther(arbiterFee)],
      });
      setSetFeesHash(hash);
      setFeeBps("");
      setArbiterFee("");
      refetch();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleSetTreasury = async () => {
    setTxError("");
    if (!isAddress(newTreasury)) { setTxError("Invalid treasury address"); return; }
    try {
      const hash = await writeContractAsync({
        ...adminContract,
        functionName: "setTreasury",
        args: [newTreasury as `0x${string}`],
      });
      setSetTreasuryHash(hash);
      setNewTreasury("");
      refetch();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  // Load escalations on mount and when admin panel is visible
  useEffect(() => { loadEscalations(); }, []);

  return (
    <div className="min-h-screen bg-[#050510]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-slate-500 text-sm">EscrowFactory — owner-only controls</p>
        </div>

        {/* Access denied */}
        {!isOwner && (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-slate-300 font-medium mb-1">Access Denied</p>
            <p className="text-slate-500 text-sm">
              {isConnected
                ? "Connected wallet is not the contract owner."
                : "Connect the owner wallet to continue."}
            </p>
            {isConnected && wallet && (
              <p className="text-xs text-slate-600 mt-3 font-mono">{wallet}</p>
            )}
          </GlassCard>
        )}

        {/* Admin content */}
        {isOwner && (
          <div className="space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Accumulated Fees",  value: `${formatEther(accumulatedFees)} BDAG` },
                { label: "Protocol Fee",       value: `${(protocolFeeBps / 100).toFixed(2)}%` },
                { label: "AI Arbiter Fee",     value: `${formatEther(aiArbiterFee)} BDAG` },
                { label: "Total Escrows",      value: escrowCount.toString() },
                { label: "Owner",              value: owner ? <AddressDisplay address={owner} /> : "—" },
                { label: "Treasury",           value: treasury ? <AddressDisplay address={treasury} /> : "—" },
              ].map(({ label, value }) => (
                <GlassCard key={label} className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-cyan-400">{value}</p>
                </GlassCard>
              ))}
            </div>

            {/* Withdraw */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Withdraw Fees</h2>
              <p className="text-xs text-slate-500 mb-4">
                Sends <span className="text-cyan-400">{formatEther(accumulatedFees)} BDAG</span> to treasury
              </p>
              <GlowButton
                onClick={handleWithdraw}
                disabled={accumulatedFees === 0n}
                className="text-sm"
              >
                Withdraw to Treasury
              </GlowButton>
              <TxStatus hash={withdrawHash} />
            </GlassCard>

            {/* Set Fees */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Update Fee Parameters</h2>
              <p className="text-xs text-slate-500 mb-4">Current: {(protocolFeeBps / 100).toFixed(2)}% protocol / {formatEther(aiArbiterFee)} BDAG arbiter</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Protocol Fee (bps, max 500)</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={feeBps}
                    onChange={e => setFeeBps(e.target.value)}
                    placeholder={`Current: ${protocolFeeBps}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">AI Arbiter Fee (BDAG)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={arbiterFee}
                    onChange={e => setArbiterFee(e.target.value)}
                    placeholder={`Current: ${formatEther(aiArbiterFee)}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <GlowButton onClick={handleSetFees} disabled={!feeBps && !arbiterFee} className="text-sm">
                Save Fee Config
              </GlowButton>
              <TxStatus hash={setFeesHash} />
            </GlassCard>

            {/* Set Treasury */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Update Treasury Address</h2>
              <p className="text-xs text-slate-500 mb-4">Current: {treasury ? <AddressDisplay address={treasury} /> : "—"}</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTreasury}
                  onChange={e => setNewTreasury(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                <GlowButton onClick={handleSetTreasury} disabled={!newTreasury} className="text-sm whitespace-nowrap">
                  Set Treasury
                </GlowButton>
              </div>
              <TxStatus hash={setTreasuryHash} />
            </GlassCard>

            {/* Error */}
            {txError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                ⚠️ {txError}
              </div>
            )}

            {/* ── Escalation Queue ─────────────────────────────────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔔</span>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-violet-300">
                    Escalation Queue
                  </h3>
                  {escalations.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                      {escalations.length}
                    </span>
                  )}
                </div>
                <button onClick={loadEscalations} disabled={loadingEsc}
                  className="text-xs text-slate-400 hover:text-white transition-colors">
                  {loadingEsc ? "Loading…" : "↻ Refresh"}
                </button>
              </div>

              {escalations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No disputes awaiting review ✓
                </p>
              ) : (
                <div className="space-y-3">
                  {escalations.map((esc: any) => (
                    <div key={esc.key}
                      className={`rounded-xl border p-4 cursor-pointer transition-colors ${selectedEsc?.key === esc.key ? "border-violet-400/50 bg-violet-400/5" : "border-white/10 hover:border-violet-400/30"}`}
                      onClick={() => setSelectedEsc(selectedEsc?.key === esc.key ? null : esc)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${esc.aiRuling === "RELEASE" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                              AI: {esc.aiRuling}
                            </span>
                            <span className="text-xs text-slate-400">{esc.confidence}/100 confidence</span>
                            <span className="text-xs text-slate-500">{esc.chainName} · {esc.amount} {esc.nativeSymbol}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono truncate">{esc.contractAddress}</p>
                          {esc.reasoning && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{esc.reasoning}</p>
                          )}
                          {esc.scores && (
                            <p className="text-xs text-slate-500 mt-1">
                              P:{esc.scores.performance} A:{esc.scores.acceptance} C:{esc.scores.communication} CT:{esc.scores.complaintTimeliness} F:{esc.scores.fraudFlag ? 1 : 0}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 shrink-0">
                          {Math.round((Date.now() - esc.escalatedAt) / 3600000)}h ago
                        </div>
                      </div>

                      {/* Review form — expands when selected */}
                      {selectedEsc?.key === esc.key && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3"
                          onClick={e => e.stopPropagation()}>

                          <div>
                            <p className="text-xs text-slate-400 mb-1 font-medium">Depositor (buyer)</p>
                            <p className="text-xs text-slate-300 font-mono">{esc.depositor}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1 font-medium">Beneficiary (seller)</p>
                            <p className="text-xs text-slate-300 font-mono">{esc.beneficiary}</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-violet-300 mb-1">
                              Your assessment
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                              Write your read on this case. Be specific — reference the evidence. 
                              This is submitted on-chain as privileged arbiter evidence and the AI will factor it in.
                            </p>
                            <textarea
                              className="w-full rounded-xl bg-white/5 border border-violet-400/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 transition-colors resize-none"
                              rows={4}
                              placeholder="e.g. Seller has FedEx tracking confirming delivery March 6th, signed by buyer. Buyer raised dispute 9 days later with no prior complaint. This is acceptance by conduct — lean RELEASE."
                              value={review}
                              onChange={e => setReview(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-violet-300 mb-1">
                              Recommended ruling (optional)
                            </label>
                            <select
                              className="w-full rounded-xl bg-[#1a1a2e] border border-violet-400/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-400/50 transition-colors cursor-pointer"
                              value={arbiterRuling}
                              onChange={e => setArbiterRuling(e.target.value as any)}>
                              <option value="">— No explicit recommendation (let AI weigh your assessment) —</option>
                              <option value="RELEASE">RELEASE — release payment to seller</option>
                              <option value="REFUND">REFUND — return funds to buyer</option>
                            </select>
                          </div>

                          {reviewResult && (
                            <div className={`text-xs px-3 py-2 rounded-lg ${reviewResult.startsWith("Error") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                              {reviewResult}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1">
                            <p className="text-xs text-slate-500">
                              Submitted on-chain from oracle wallet · AI re-evaluates on next poll
                            </p>
                            <button
                              onClick={submitReview}
                              disabled={!review.trim() || submittingReview}
                              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                                !review.trim() || submittingReview
                                  ? "bg-white/5 text-slate-500 cursor-not-allowed"
                                  : "bg-violet-500/20 text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 hover:border-violet-400/60"
                              }`}>
                              {submittingReview ? "Submitting…" : "Submit Review →"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

          </div>
        )}
      </main>
    </div>
  );
}
