"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePathname } from "@/i18n/navigation";
import { createPublicClient, http } from "viem";
import { SIMPLE_ESCROW_ABI, SIMPLE_STATE_LABEL } from "@/lib/contracts";
import { getChain, DEFAULT_CHAIN_ID } from "@/lib/chains";
import { useToast } from "@/components/toast";
import { GlowButton } from "@/components/ui/glow-button";
import { cn } from "@/lib/utils";

const ISSUE_TYPES = [
  "Transaction Failed",
  "Wallet Not Connecting",
  "Escrow Not Loading",
  "UI Bug",
  "Funds Not Released",
  "Other",
];

const defaultChainConfig = getChain(DEFAULT_CHAIN_ID);
const rpcClient = createPublicClient({
  chain: defaultChainConfig.chain as Parameters<typeof createPublicClient>[0]["chain"],
  transport: http(defaultChainConfig.rpcUrl),
});

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  lastTxHash?: string;
}

export function SupportModal({ open, onClose, lastTxHash }: SupportModalProps) {
  const { address: wallet, isConnected } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();
  const { addToast } = useToast();

  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Infer escrow ID from route /escrow/0x...
  const escrowMatch = pathname.match(/\/escrow\/(0x[0-9a-fA-F]{40})/i);
  const escrowId = escrowMatch?.[1] as `0x${string}` | undefined;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Fetch contract state if on an escrow page
    let contractState: string | null = null;
    if (escrowId) {
      try {
        const raw = await rpcClient.readContract({
          address: escrowId,
          abi: SIMPLE_ESCROW_ABI,
          functionName: "state",
        });
        contractState = SIMPLE_STATE_LABEL[raw as number] ?? String(raw);
      } catch { /* ignore — escrow may be milestone type */ }
    }

    const payload = {
      issueType,
      description: description.trim() || null,
      wallet: wallet ?? null,
      escrowId: escrowId ?? null,
      route: pathname,
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      chainId,
      connectionStatus: isConnected ? "connected" : "disconnected",
      contractState,
      lastTxHash: lastTxHash ?? null,
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      addToast({ type: "success" as const, message: "Support request sent." });
      setDescription("");
      setIssueType(ISSUE_TYPES[0]);
      onClose();
    } catch {
      addToast({ type: "error" as const, message: "Failed to send support request. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛟</span>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Report an Issue</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Issue type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Issue Type
            </label>
            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            >
              {ISSUE_TYPES.map(t => (
                <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Description <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What happened? What were you trying to do?"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
            />
          </div>

          {/* Auto-captured metadata preview */}
          <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-600 mb-2">Auto-captured</p>
            {(
              [
                ["Wallet", wallet ? `${wallet.slice(0, 8)}…${wallet.slice(-6)}` : "not connected"],
                ["Network", getChain(chainId).chain.name],
                ["Page", pathname],
                ...(escrowId ? [["Escrow", `${escrowId.slice(0, 10)}…`]] : []),
                ...(lastTxHash ? [["Last Tx", `${lastTxHash.slice(0, 14)}…`]] : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-400 font-mono">{v}</span>
              </div>
            ))}
          </div>

          <GlowButton
            type="submit"
            variant="primary"
            loading={submitting}
            className="w-full py-2.5"
          >
            Send Report
          </GlowButton>

          <p className="text-xs text-slate-400 text-center mt-3">
            Covered by one or more U.S. provisional patent applications. Patent Pending.
          </p>
        </form>
      </div>
    </div>
  );
}
