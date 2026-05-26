"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MarketplaceNav } from "@/components/marketplace-nav";
import { Footer } from "@/components/footer";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { CONTRACTS } from "@/lib/contracts";
import FactoryAbi from "@/lib/abi-EscrowFactory.json";

const OWNER_ADDRESS = "0xDBED228e19fe0d37a2ebBe90A2a9314C624ef4Ad";
const FACTORY_ADDRESS = CONTRACTS.factory;

/* ── helpers (viem-free) ─────────────────────────────────────────── */
function fmtEther(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

function parseEther(val: string): bigint {
  return BigInt(Math.floor(parseFloat(val) * 1e18));
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/i.test(addr);
}

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ── ABI slice for admin functions ───────────────────────────────── */
const ADMIN_ABI = FactoryAbi.filter(
  (x: any) =>
    x.type === "function" &&
    [
      "accumulatedFees",
      "protocolFeeBps",
      "aiArbiterFee",
      "treasury",
      "owner",
      "withdrawFees",
      "setFees",
      "setTreasury",
      "escrowCount",
    ].includes(x.name)
);

/* ── TxStatus helper ─────────────────────────────────────────────── */
function TxStatus({ hash }: { hash?: `0x${string}` }) {
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (!hash) return null;
  if (isLoading)
    return <p className="text-xs text-yellow-400 mt-2 animate-pulse">⏳ Confirming…</p>;
  if (isSuccess)
    return <p className="text-xs text-green-400 mt-2">✅ Confirmed!</p>;
  return null;
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { address: wallet, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txError, setTxError] = useState("");

  /* form state */
  const [feeBps, setFeeBps] = useState("");
  const [arbiterFee, setArbiterFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");

  /* tx hashes */
  const [withdrawHash, setWithdrawHash]   = useState<`0x${string}` | undefined>();
  const [setFeesHash, setSetFeesHash]     = useState<`0x${string}` | undefined>();
  const [setTreasuryHash, setSetTreasuryHash] = useState<`0x${string}` | undefined>();

  const isOwner = isConnected && wallet?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const { data, refetch } = useReadContracts({
    contracts: [
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "accumulatedFees" },
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "protocolFeeBps" },
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "aiArbiterFee" },
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "treasury" },
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "owner" },
      { address: FACTORY_ADDRESS, abi: ADMIN_ABI, functionName: "escrowCount" },
    ],
    query: { refetchInterval: 10_000 },
  });

  const accumulatedFees = (data?.[0]?.result as bigint | undefined) ?? 0n;
  const protocolFeeBps  = (data?.[1]?.result as number  | undefined) ?? 0;
  const aiArbiterFee    = (data?.[2]?.result as bigint | undefined) ?? 0n;
  const treasury        = (data?.[3]?.result as `0x${string}` | undefined);
  const owner           = (data?.[4]?.result as `0x${string}` | undefined);
  const escrowCount     = (data?.[5]?.result as bigint | undefined) ?? 0n;

  /* ── handlers ──────────────────────────────────────────────────── */
  const handleWithdraw = async () => {
    setTxError("");
    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: ADMIN_ABI,
        functionName: "withdrawFees",
      });
      setWithdrawHash(hash);
      refetch();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleSetFees = async () => {
    setTxError("");
    const bps = parseInt(feeBps);
    if (isNaN(bps) || bps < 0 || bps > 500) {
      setTxError("Protocol fee must be 0–500 bps (0–5%)");
      return;
    }
    if (!arbiterFee || isNaN(parseFloat(arbiterFee))) {
      setTxError("Invalid AI arbiter fee");
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: ADMIN_ABI,
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
    if (!isValidAddress(newTreasury)) {
      setTxError("Invalid treasury address");
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: ADMIN_ABI,
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
      <MarketplaceNav />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-slate-500 text-sm">
            EscrowFactory — owner-only controls
          </p>
        </div>

        {/* ── Access denied ───────────────────────────────────────── */}
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

        {/* ── Admin content ───────────────────────────────────────── */}
        {isOwner && (
          <div className="space-y-6">
            {/* stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Accumulated Fees", value: `${fmtEther(accumulatedFees)} CELO` },
                { label: "Protocol Fee",     value: `${(protocolFeeBps / 100).toFixed(2)}%` },
                { label: "AI Arbiter Fee",   value: `${fmtEther(aiArbiterFee)} CELO` },
                { label: "Total Escrows",    value: escrowCount.toString() },
                { label: "Owner",            value: owner ? shorten(owner) : "—" },
                { label: "Treasury",         value: treasury ? shorten(treasury) : "—" },
              ].map(({ label, value }) => (
                <GlassCard key={label} className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-cyan-400">{value}</p>
                </GlassCard>
              ))}
            </div>

            {/* withdraw */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Withdraw Fees</h2>
              <p className="text-xs text-slate-500 mb-4">
                Sends <span className="text-cyan-400">{fmtEther(accumulatedFees)} CELO</span> to treasury
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

            {/* set fees */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Update Fee Parameters</h2>
              <p className="text-xs text-slate-500 mb-4">
                Current: {(protocolFeeBps / 100).toFixed(2)}% protocol / {fmtEther(aiArbiterFee)} CELO arbiter
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Protocol Fee (bps, max 500)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={feeBps}
                    onChange={(e) => setFeeBps(e.target.value)}
                    placeholder={`Current: ${protocolFeeBps}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    AI Arbiter Fee (CELO)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={arbiterFee}
                    onChange={(e) => setArbiterFee(e.target.value)}
                    placeholder={`Current: ${fmtEther(aiArbiterFee)}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <GlowButton onClick={handleSetFees} disabled={!feeBps && !arbiterFee} className="text-sm">
                Save Fee Config
              </GlowButton>
              <TxStatus hash={setFeesHash} />
            </GlassCard>

            {/* set treasury */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Update Treasury Address</h2>
              <p className="text-xs text-slate-500 mb-4">
                Current: {treasury ? shorten(treasury) : "—"}
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTreasury}
                  onChange={(e) => setNewTreasury(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                <GlowButton onClick={handleSetTreasury} disabled={!newTreasury} className="text-sm whitespace-nowrap">
                  Set Treasury
                </GlowButton>
              </div>
              <TxStatus hash={setTreasuryHash} />
            </GlassCard>

            {txError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                ⚠️ {txError}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
