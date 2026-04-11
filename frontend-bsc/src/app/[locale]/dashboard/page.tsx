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

type EscrowRecord = {
  contractAddress: `0x${string}`;
  escrowType: number;
  depositor: `0x${string}`;
  beneficiary: `0x${string}`;
  totalAmount: bigint;
};

function EscrowGrid({ escrows, wallet }: { escrows: EscrowRecord[]; wallet?: `0x${string}` }) {
  const t = useTranslations("dashboard");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {escrows.map(e => (
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
              {(Number(e.totalAmount) / 1e18).toFixed(4)} ETH · {t("tapToOpen")}
            </p>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}

// Sub-component that fetches escrows for any wallet address
function WalletEscrowLookup({ chainId }: { chainId: number }) {
  const [lookupInput, setLookupInput] = useState("");
  const [lookupAddr, setLookupAddr] = useState<`0x${string}` | undefined>(undefined);
  const [lookupError, setLookupError] = useState("");
  const factoryAddress = getFactoryAddress(chainId);

  const { asDepositor, asBeneficiary, isLoading } = useWalletEscrows(lookupAddr, chainId);
  const indices = Array.from(new Set([...asDepositor, ...asBeneficiary].map(n => Number(n))));

  const { data: escrowData, isLoading: recordsLoading } = useReadContracts({
    contracts: indices.map(i => ({
      address: factoryAddress,
      abi: ESCROW_FACTORY_ABI,
      functionName: "escrows" as const,
      args: [BigInt(i)],
      chainId,
    })),
    query: { enabled: indices.length > 0 },
  });

  const escrows: EscrowRecord[] = (escrowData ?? [])
    .map((r) => {
      const raw = r?.result as Record<string, unknown> | unknown[] | null | undefined;
      if (!raw) return null;
      const get = (key: string, idx: number) =>
        Array.isArray(raw) ? raw[idx] : (raw as Record<string, unknown>)[key];
      const contractAddress = get("contractAddress", 0) as `0x${string}`;
      if (!contractAddress || typeof contractAddress !== "string") return null;
      return {
        contractAddress,
        escrowType: get("escrowType", 1) as number,
        depositor: get("depositor", 2) as `0x${string}`,
        beneficiary: get("beneficiary", 3) as `0x${string}`,
        totalAmount: get("totalAmount", 5) as bigint,
      };
    })
    .filter((e): e is EscrowRecord => !!e);

  function handleLookup() {
    const addr = lookupInput.trim();
    if (!isValidAddress(addr)) {
      setLookupError("Invalid wallet address");
      return;
    }
    setLookupError("");
    setLookupAddr(addr as `0x${string}`);
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
        Look Up Escrows by Wallet Address
      </h2>
      <p className="text-xs text-slate-600 mb-4">Find all escrows where a wallet is depositor or beneficiary</p>
      <div className="flex gap-3">
        <input
          value={lookupInput}
          onChange={e => { setLookupInput(e.target.value); setLookupError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLookup()}
          placeholder="0x wallet address..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
        />
        <GlowButton variant="secondary" onClick={handleLookup}>Search</GlowButton>
      </div>
      {lookupError && <p className="mt-2 text-xs text-red-400">{lookupError}</p>}
      {lookupAddr && (isLoading || recordsLoading) && (
        <p className="mt-4 text-xs text-slate-500 animate-pulse">Searching...</p>
      )}
      {lookupAddr && !isLoading && !recordsLoading && escrows.length === 0 && (
        <p className="mt-4 text-xs text-slate-500">No escrows found for that address.</p>
      )}
      {escrows.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-3">{escrows.length} escrow{escrows.length !== 1 ? "s" : ""} found</p>
          <EscrowGrid escrows={escrows} wallet={lookupAddr} />
        </div>
      )}
    </GlassCard>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { address: walletLive } = useAccount();
  const [walletCached, setWalletCached] = useState<`0x${string}` | undefined>(undefined);
  useEffect(() => { if (walletLive) setWalletCached(walletLive); }, [walletLive]);
  const wallet = walletCached;
  const walletForQuery = walletLive ?? walletCached;
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [viewed, setViewed] = useState<ViewedEscrow[]>([]);
  const [cachedEscrows, setCachedEscrows] = useState<EscrowRecord[]>([]);

  const { asDepositor, asBeneficiary, isLoading: walletLoading } = useWalletEscrows(walletForQuery, chainId);
  const myIndices = Array.from(new Set([...asDepositor, ...asBeneficiary].map(n => Number(n))));

  const { data: escrowData, isLoading: recordsLoading, isFetching: recordsFetching } = useReadContracts({
    contracts: myIndices.map(i => ({
      address: factoryAddress,
      abi: ESCROW_FACTORY_ABI,
      functionName: "escrows" as const,
      args: [BigInt(i)],
      chainId,
    })),
    query: { enabled: myIndices.length > 0, refetchInterval: 30_000 },
  });

  const myEscrows: EscrowRecord[] = (escrowData ?? [])
    .map((r) => {
      const raw = r?.result as Record<string, unknown> | unknown[] | null | undefined;
      if (!raw) return null;
      const get = (key: string, idx: number) =>
        Array.isArray(raw) ? raw[idx] : (raw as Record<string, unknown>)[key];
      const contractAddress = get("contractAddress", 0) as `0x${string}`;
      if (!contractAddress || typeof contractAddress !== "string") return null;
      return {
        contractAddress,
        escrowType: get("escrowType", 1) as number,
        depositor: get("depositor", 2) as `0x${string}`,
        beneficiary: get("beneficiary", 3) as `0x${string}`,
        totalAmount: get("totalAmount", 5) as bigint,
      };
    })
    .filter((e): e is EscrowRecord => !!e);

  useEffect(() => { setViewed(getViewedEscrows()); }, []);

  useEffect(() => {
    if (myEscrows.length > 0) setCachedEscrows(myEscrows);
  }, [myEscrows.length, escrowData]);

  function handleLoad() {
    const addr = input.trim();
    if (!isValidAddress(addr)) {
      setError(t("invalidAddress"));
      return;
    }
    setError("");
    router.push(`/escrow/${addr}`);
  }

  const isFirstLoad = (walletLoading && !asDepositor.length) || (recordsLoading && !escrowData);
  const isLoading = isFirstLoad;

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
              ) : cachedEscrows.length === 0 && !recordsFetching ? (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-500 text-sm">{t("noEscrows")}</p>
                  <p className="text-slate-600 text-xs mt-1">{t("noEscrowsHint")}</p>
                </GlassCard>
              ) : (
                <EscrowGrid escrows={cachedEscrows} wallet={wallet} />
              )}
            </div>

            {/* Look up by wallet address */}
            <WalletEscrowLookup chainId={chainId} />

            {/* Load by contract address */}
            <GlassCard className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Load Escrow by Contract Address
              </h2>
              <p className="text-xs text-slate-600 mb-4">Go directly to an escrow if you have its contract address</p>
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLoad()}
                  placeholder="0x contract address..."
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
