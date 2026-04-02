"use client";

import { useState } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, isAddress } from "viem";
import { Nav } from "@/components/nav";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { AddressDisplay } from "@/components/ui/address-display";
import { ESCROW_FACTORY_ABI, FACTORY_ADDRESS, EXPLORER_TX_URL } from "@/lib/contracts";

const OWNER_ADDRESS = "0x202eBD8c160BF77Eb026406c7C2BA2602E974EaA";

const contract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: ESCROW_FACTORY_ABI,
} as const;

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

const adminContract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: ADMIN_ABI,
} as const;

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

  // Fee form state
  const [feeBps, setFeeBps]         = useState("");
  const [arbiterFee, setArbiterFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");

  const { writeContractAsync } = useWriteContract();
  const [withdrawHash,  setWithdrawHash]  = useState<`0x${string}` | undefined>();
  const [setFeesHash,   setSetFeesHash]   = useState<`0x${string}` | undefined>();
  const [setTreasuryHash, setSetTreasuryHash] = useState<`0x${string}` | undefined>();
  const [txError, setTxError] = useState("");

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

          </div>
        )}
      </main>
    </div>
  );
}
