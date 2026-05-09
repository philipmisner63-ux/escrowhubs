"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseEther, isAddress, type Abi } from "viem";
import { CONTRACTS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTORY = CONTRACTS.factory;
const ABI = FactoryABI as Abi;
const CUSD_DECIMALS = 18;
const KNOWN_REFERRERS: `0x${string}`[] = [
  "0x7ed3d953ad3ef99f101f4808d4c123052c583282",
];

// Tier thresholds
const TIER2_MIN_COUNT = 100n;           // ≥ 100 escrows → eligible for Tier 2
const TIER3_MIN_VOL   = 10_000n * (10n ** 18n); // ≥ $10K volume → eligible for Tier 3
const TIER1_BPS = 2000;
const TIER2_BPS = 2500;
const TIER3_BPS = 3000;

// ─── Tier helpers ─────────────────────────────────────────────────────────────

function computeTier(count: bigint, volume: bigint): number {
  if (volume >= TIER3_MIN_VOL) return 3;
  if (count >= TIER2_MIN_COUNT) return 2;
  return 1;
}

function tierLabel(tier: number): string {
  return `Tier ${tier} (${tier === 1 ? "20" : tier === 2 ? "25" : "30"}%)`;
}

function nextTierBps(count: bigint, volume: bigint): number | null {
  if (volume >= TIER3_MIN_VOL) return null; // already max
  if (count >= TIER2_MIN_COUNT) return TIER3_BPS;
  return TIER2_BPS;
}

function progressToNextTier(count: bigint, volume: bigint): { label: string; pct: number } {
  if (volume >= TIER3_MIN_VOL) return { label: "Max tier reached", pct: 100 };
  if (count >= TIER2_MIN_COUNT) {
    const pct = Math.min(100, Number((volume * 100n) / TIER3_MIN_VOL));
    const volStr = parseFloat(formatUnits(volume, CUSD_DECIMALS)).toFixed(0);
    return { label: `$${volStr} / $10,000 vol → Tier 3`, pct };
  }
  const pct = Math.min(100, Number((count * 100n) / TIER2_MIN_COUNT));
  return { label: `${count} / 100 escrows → Tier 2`, pct };
}

// ─── Small components ─────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.06] border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

function TxStatus({ hash }: { hash?: `0x${string}` }) {
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (!hash) return null;
  if (isLoading) return <p className="text-xs text-yellow-400 mt-2 animate-pulse">⏳ Confirming…</p>;
  if (isSuccess) return <p className="text-xs text-green-400 mt-2">✅ Confirmed!</p>;
  return null;
}

function Btn({
  onClick,
  disabled = false,
  children,
  small = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white font-bold rounded-xl shadow-lg shadow-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${small ? "px-3 py-1.5 text-xs" : "px-5 py-3 text-sm"}`}
    >
      {children}
    </button>
  );
}

// ─── Referrer row ─────────────────────────────────────────────────────────────

function ReferrerRow({
  wallet,
  onUpgrade,
}: {
  wallet: `0x${string}`;
  onUpgrade: (addr: `0x${string}`, bps: number) => void;
}) {
  const { data } = useReadContracts({
    contracts: [
      { address: FACTORY, abi: ABI, functionName: "getReferralStats", args: [wallet] },
    ],
  });

  const raw = data?.[0]?.result as [bigint, bigint, bigint, bigint, number] | undefined;
  const count     = raw?.[0] ?? 0n;
  const volume    = raw?.[1] ?? 0n;
  const earned    = raw?.[2] ?? 0n;
  const claimable = raw?.[3] ?? 0n;
  const shareBps  = raw?.[4] ?? TIER1_BPS;

  const tier       = computeTier(count, volume);
  const progress   = progressToNextTier(count, volume);
  const upgradeBps = nextTierBps(count, volume);
  const isEligible = upgradeBps !== null && (
    upgradeBps === TIER2_BPS ? count >= TIER2_MIN_COUNT : volume >= TIER3_MIN_VOL
  );

  const shortWallet = `${wallet.slice(0, 8)}…${wallet.slice(-6)}`;
  const volDisplay  = parseFloat(formatUnits(volume, CUSD_DECIMALS)).toFixed(2);
  const earnDisplay = parseFloat(formatUnits(earned, CUSD_DECIMALS)).toFixed(4);

  return (
    <div className="p-4 flex flex-col gap-3 border-b border-white/5 last:border-0">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-mono text-xs text-white/60">{shortWallet}</p>
          <p className="text-sm text-white font-semibold mt-0.5">{tierLabel(tier)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">{Number(count)} escrows</p>
          <p className="text-xs text-[#35D07F]">${volDisplay} vol</p>
          <p className="text-xs text-white/40">{earnDisplay} earned</p>
        </div>
      </div>

      {/* Current rate badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-white/70">
          Rate: {(shareBps / 100).toFixed(0)}% ({shareBps} bps)
        </span>
        {claimable > 0n && (
          <span className="text-xs bg-yellow-500/20 text-yellow-300 rounded-full px-2 py-0.5">
            {parseFloat(formatUnits(claimable, CUSD_DECIMALS)).toFixed(4)} claimable
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>{progress.label}</span>
          <span>{progress.pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#35D07F] to-[#0EA56F] transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      {/* Upgrade button */}
      {isEligible && upgradeBps !== null && (
        <Btn small onClick={() => onUpgrade(wallet, upgradeBps)}>
          Upgrade → {tierLabel(upgradeBps === TIER2_BPS ? 2 : 3)}
        </Btn>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { address: wallet, isConnected } = useAccount();

  // Form state
  const [feeBps,      setFeeBps]      = useState("");
  const [arbiterFee,  setArbiterFee]  = useState("");
  const [newTreasury, setNewTreasury] = useState("");
  const [txError,     setTxError]     = useState("");

  // Tx hashes
  const [withdrawHash,  setWithdrawHash]  = useState<`0x${string}` | undefined>();
  const [feesHash,      setFeesHash]      = useState<`0x${string}` | undefined>();
  const [treasuryHash,  setTreasuryHash]  = useState<`0x${string}` | undefined>();
  const [upgradeHash,   setUpgradeHash]   = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  // Read contract state
  const { data, refetch } = useReadContracts({
    contracts: [
      { address: FACTORY, abi: ABI, functionName: "owner" },
      { address: FACTORY, abi: ABI, functionName: "accumulatedFees" },
      { address: FACTORY, abi: ABI, functionName: "protocolFeeBps" },
      { address: FACTORY, abi: ABI, functionName: "aiArbiterFee" },
      { address: FACTORY, abi: ABI, functionName: "treasury" },
      { address: FACTORY, abi: ABI, functionName: "escrowCount" },
    ],
    query: { refetchInterval: 15_000 },
  });

  const owner          = (data?.[0]?.result as `0x${string}` | undefined);
  const accumulatedFees= (data?.[1]?.result as bigint | undefined) ?? 0n;
  const protocolFeeBps = (data?.[2]?.result as number | undefined) ?? 0;
  const aiArbiterFee   = (data?.[3]?.result as bigint | undefined) ?? 0n;
  const treasury       = (data?.[4]?.result as `0x${string}` | undefined);
  const escrowCount    = (data?.[5]?.result as bigint | undefined) ?? 0n;

  const isOwner = isConnected && !!wallet && !!owner &&
    wallet.toLowerCase() === owner.toLowerCase();

  const short = (a?: string) => a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—";

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleWithdraw = async () => {
    setTxError("");
    try {
      const hash = await writeContractAsync({ address: FACTORY, abi: ABI, functionName: "withdrawFees" });
      setWithdrawHash(hash);
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleSetFees = async () => {
    setTxError("");
    const bps = parseInt(feeBps);
    if (!feeBps && !arbiterFee) return;
    if (feeBps && (isNaN(bps) || bps < 0 || bps > 500)) {
      setTxError("Protocol fee must be 0–500 bps");
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: FACTORY, abi: ABI, functionName: "setFees",
        args: [feeBps ? bps : protocolFeeBps, arbiterFee ? parseEther(arbiterFee) : aiArbiterFee],
      });
      setFeesHash(hash);
      setFeeBps("");
      setArbiterFee("");
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleSetTreasury = async () => {
    setTxError("");
    if (!isAddress(newTreasury)) { setTxError("Invalid address"); return; }
    try {
      const hash = await writeContractAsync({
        address: FACTORY, abi: ABI, functionName: "setTreasury",
        args: [newTreasury as `0x${string}`],
      });
      setTreasuryHash(hash);
      setNewTreasury("");
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const handleUpgrade = async (referrer: `0x${string}`, bps: number) => {
    setTxError("");
    try {
      const hash = await writeContractAsync({
        address: FACTORY, abi: ABI, functionName: "setReferrerShare",
        args: [referrer, bps],
      });
      setUpgradeHash(hash);
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-2xl mx-auto">
      <Link href="/" className="tap-compress text-white/60 text-sm mb-6 flex items-center gap-1">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
      <p className="text-white/40 text-sm mb-8">EscrowFactory — Celo Mainnet</p>

      {/* Access denied */}
      {!isOwner && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-white font-semibold mb-1">Access Denied</p>
          <p className="text-white/50 text-sm">
            {isConnected
              ? "Connected wallet is not the contract owner."
              : "Connect the owner wallet to continue."}
          </p>
          {isConnected && wallet && (
            <p className="text-xs text-white/30 mt-3 font-mono">{wallet}</p>
          )}
          {owner && (
            <p className="text-xs text-white/30 mt-1">Owner: {owner}</p>
          )}
        </Card>
      )}

      {isOwner && (
        <div className="flex flex-col gap-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Accumulated Fees", value: `${parseFloat(formatUnits(accumulatedFees, 18)).toFixed(4)} CELO` },
              { label: "Protocol Fee",     value: `${(protocolFeeBps / 100).toFixed(2)}%` },
              { label: "AI Arbiter Fee",   value: `${parseFloat(formatUnits(aiArbiterFee, 18)).toFixed(3)} CELO` },
              { label: "Total Escrows",    value: escrowCount.toString() },
              { label: "Owner",            value: short(owner) },
              { label: "Treasury",         value: short(treasury) },
            ].map(({ label, value }) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-white/40 mb-1">{label}</p>
                <p className="text-sm font-semibold text-[#35D07F] font-mono">{value}</p>
              </Card>
            ))}
          </div>

          {/* Withdraw Fees */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-white mb-1">Withdraw Fees</h2>
            <p className="text-xs text-white/40 mb-4">
              Sends <span className="text-[#35D07F]">{parseFloat(formatUnits(accumulatedFees, 18)).toFixed(4)} CELO</span> to treasury ({short(treasury)})
            </p>
            <Btn onClick={handleWithdraw} disabled={accumulatedFees === 0n}>
              Withdraw to Treasury
            </Btn>
            <TxStatus hash={withdrawHash} />
          </Card>

          {/* Update Fee Parameters */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-white mb-1">Update Fee Parameters</h2>
            <p className="text-xs text-white/40 mb-4">
              Current: {(protocolFeeBps / 100).toFixed(2)}% protocol / {parseFloat(formatUnits(aiArbiterFee, 18)).toFixed(3)} CELO arbiter
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1">Protocol Fee (bps, max 500)</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={feeBps}
                  onChange={e => setFeeBps(e.target.value)}
                  placeholder={`${protocolFeeBps}`}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#35D07F]/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1">AI Arbiter Fee (CELO)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={arbiterFee}
                  onChange={e => setArbiterFee(e.target.value)}
                  placeholder={parseFloat(formatUnits(aiArbiterFee, 18)).toFixed(3)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#35D07F]/50"
                />
              </div>
            </div>
            <Btn onClick={handleSetFees} disabled={!feeBps && !arbiterFee}>
              Save Fee Config
            </Btn>
            <TxStatus hash={feesHash} />
          </Card>

          {/* Referrer Leaderboard */}
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-sm font-bold text-white mb-1">Referrer Leaderboard</h2>
              <p className="text-xs text-white/40">
                Volume-based tier system. Upgrade applies an on-chain per-referrer rate override.
              </p>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-white/60">Tier 1: 20% ({TIER1_BPS} bps)</span>
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-white/60">Tier 2: 25% ({TIER2_BPS} bps) @ 100 escrows</span>
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-white/60">Tier 3: 30% ({TIER3_BPS} bps) @ $10K vol</span>
              </div>
            </div>
            {KNOWN_REFERRERS.map(addr => (
              <ReferrerRow key={addr} wallet={addr} onUpgrade={handleUpgrade} />
            ))}
            <TxStatus hash={upgradeHash} />
          </Card>

          {/* Update Treasury */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-white mb-1">Update Treasury</h2>
            <p className="text-xs text-white/40 mb-4">Current: <span className="font-mono">{treasury ?? "—"}</span></p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTreasury}
                onChange={e => setNewTreasury(e.target.value)}
                placeholder="0x…"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#35D07F]/50 font-mono"
              />
              <Btn onClick={handleSetTreasury} disabled={!newTreasury}>
                Set
              </Btn>
            </div>
            <TxStatus hash={treasuryHash} />
          </Card>

          {/* Error */}
          {txError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              ⚠️ {txError}
            </div>
          )}

        </div>
      )}
    </main>
  );
}
