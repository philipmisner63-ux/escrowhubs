"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useAccount, useReadContracts, useChainId } from "wagmi";
import { Nav } from "@/components/nav";
import { ShareButton } from "@/components/share-escrow";
import { Footer } from "@/components/footer";
import { useTranslations } from "next-intl";
import { PageWrapper } from "@/components/page-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddressDisplay } from "@/components/ui/address-display";
import { useWalletEscrows } from "@/lib/hooks/useEscrowFactory";
import { ESCROW_FACTORY_ABI } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";
import { getViewedEscrows, type ViewedEscrow } from "@/lib/localStorage";
import { ReferralPanel } from "@/components/referral-panel";

function isValidAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function stateToStatus(stateNum: number): "pending" | "active" | "complete" | "disputed" {
  if (stateNum === 0) return "pending";
  if (stateNum === 1) return "active";
  if (stateNum === 2) return "complete";
  if (stateNum === 3) return "disputed";
  return "pending";
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [viewed, setViewed] = useState<ViewedEscrow[]>([]);

  const { asDepositor, asBeneficiary, isLoading: walletLoading } = useWalletEscrows(wallet, chainId);

  // Get escrow addresses directly from factory using raw index lookup
  const myIndices = Array.from(new Set([...asDepositor, ...asBeneficiary].map(n => Number(n))));

  const { data: escrowData, isLoading: recordsLoading } = useReadContracts({
    contracts: myIndices.map(i => ({
      address: factoryAddress,
      abi: ESCROW_FACTORY_ABI,
      functionName: "escrows" as const,
      args: [BigInt(i)],
      chainId,
    })),
    query: { enabled: myIndices.length > 0, refetchInterval: 5_000 },
  });

  const myEscrows = (escrowData ?? [])
    .map((r) => {
      const raw = r?.result;
      if (!raw) return null;
      // Result may be array-like or object depending on wagmi version
      const arr = Array.isArray(raw) ? raw : Object.values(raw);
      const contractAddress = arr[0] as `0x${string}`;
      if (!contractAddress || typeof contractAddress !== 'string') return null;
      return {
        contractAddress,
        escrowType: arr[1] as number,
        depositor: arr[2] as `0x${string}`,
        beneficiary: arr[3] as `0x${string}`,
        totalAmount: arr[5] as bigint,
      };
    })
    .filter((e): e is { contractAddress: `0x${string}`; escrowType: number; depositor: `0x${string}`; beneficiary: `0x${string}`; totalAmount: bigint } => !!e);

  useEffect(() => {
    setViewed(getViewedEscrows());
  }, []);

  function handleLoad() {
    const addr = input.trim();
    if (!isValidAddress(addr)) {
      setError(t("invalidAddress"));
      return;
    }
    setError("");
    router.push(`/escrow/${addr}`);
  }

  const isLoading = walletLoading || recordsLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageWrapper>
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
                <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
              </div>
              <Link href="/create">
                <GlowButton variant="primary">{t("newEscrow")}</GlowButton>
              </Link>
            </div>

            {/* My Escrows */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
                My Escrows
              </h2>
              {!wallet ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">{t("connectWalletPrompt")}</p>
                </GlassCard>
              ) : isLoading ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm animate-pulse">{t("loading")}</p>
                </GlassCard>
              ) : myEscrows.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">{t("noEscrows")}</p>
                  <p className="text-slate-600 text-xs mt-1">{t("noEscrowsHint")}</p>
                </GlassCard>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myEscrows.map(e => (
                    <Link key={e.contractAddress} href={`/escrow/${e.contractAddress}`}>
                      <GlassCard className="p-4 cursor-pointer hover:border-cyan-400/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={e.depositor?.toLowerCase() === wallet?.toLowerCase() ? "active" : "pending"} />
                          <span className="text-xs text-slate-500">
                            {e.escrowType === 0 ? t("simple") : t("milestone")}
                          </span>
                          <ShareButton address={e.contractAddress} />
                        </div>
                        <p className="text-xs font-mono text-slate-300 truncate">
                          {e.contractAddress.slice(0, 10)}…{e.contractAddress.slice(-6)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(Number(e.totalAmount) / 1e18).toFixed(4)} BDAG · {t("tapToOpen")}
                        </p>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Load by address */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Load Escrow by Address
              </h2>
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLoad()}
                  placeholder="0x..."
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
                />
                <GlowButton variant="primary" onClick={handleLoad}>{t("load")}</GlowButton>
              </div>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </GlassCard>

            {/* Recently Viewed */}
            {viewed.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Recently Viewed
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {viewed.map(e => (
                    <Link key={e.address} href={`/escrow/${e.address}`}>
                      <GlassCard className="p-4 cursor-pointer hover:border-cyan-400/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={e.type === "unknown" ? "pending" : e.type} />
                          <span className="text-xs text-slate-600">
                            {new Date(e.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {e.title && <p className="text-sm font-medium text-white mb-1">{e.title}</p>}
                        <AddressDisplay address={e.address} />
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageWrapper>
        {/* Referral section */}
        <div className="mx-auto max-w-4xl w-full px-4 pb-10">
          <ReferralPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
