"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { useTranslations } from "next-intl";
import { ESCROW_FACTORY_ABI } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const APP_URL = "https://base.escrowhubs.io";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold font-mono ${accent ? "text-cyan-400" : "text-slate-200"}`}>
        {value}
      </p>
    </div>
  );
}

export function ReferralPanel() {
  const t = useTranslations("referral");
  const { address: wallet, isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [claimHash, setClaimHash] = useState<`0x${string}` | undefined>();

  const referralLink = wallet ? `${APP_URL}/?ref=${wallet}` : "";

  // Read stats
  const { data: statsRaw, refetch: refetchStats } = useReadContract({
    address: factoryAddress,
    abi: ESCROW_FACTORY_ABI,
    functionName: "getReferralStats",
    args: wallet ? [wallet] : [ZERO],
    chainId,
    query: { enabled: !!wallet, refetchInterval: 10_000 },
  });

  const stats = statsRaw as [bigint, bigint, bigint] | undefined;
  const referralCount = stats ? Number(stats[0]) : 0;
  const totalEarned   = stats ? formatEther(stats[1]) : "0";
  const claimable     = stats ? stats[2] : 0n;

  // Claim write
  const { writeContractAsync, isPending: isClaiming } = useWriteContract();

  // Wait for claim confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
    query: { enabled: !!claimHash },
  });

  useEffect(() => {
    if (isConfirmed && claimHash) {
      addToast({ type: "success", message: t("claimed") });
      setClaimHash(undefined);
      refetchStats();
    }
  }, [isConfirmed, claimHash]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      addToast({ type: "success", message: t("copied") });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink, addToast, t]);

  const handleClaim = async () => {
    if (!wallet || claimable === 0n) return;
    try {
      const hash = await writeContractAsync({
        address: factoryAddress,
        abi: ESCROW_FACTORY_ABI,
        functionName: "claimReferralEarnings",
        args: [],
        chainId,
      });
      setClaimHash(hash);
      addToast({ type: "pending", message: "Claiming ETH…", txHash: hash });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message.slice(0, 100) : "Claim failed" });
    }
  };

  if (!isConnected || !wallet) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/2 p-6 text-center text-sm text-slate-500">
        {t("connectWallet")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span>🎁</span> {t("title")}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* How it works */}
      <p className="text-xs text-slate-500 leading-relaxed bg-white/3 border border-white/8 rounded-xl px-4 py-3">
        💡 {t("howItWorks")}
      </p>

      {/* Referral link */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{t("yourLink")}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-mono text-cyan-400 truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{t("stats")}</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t("referrals")}    value={String(referralCount)} />
          <StatCard label={t("totalEarned")}  value={`${parseFloat(totalEarned).toFixed(4)} ETH`} />
          <StatCard label={t("claimable")}    value={`${parseFloat(formatEther(claimable)).toFixed(4)} ETH`} accent={claimable > 0n} />
        </div>
      </div>

      {/* Claim button */}
      {claimable > 0n && (
        <GlowButton
          variant="primary"
          onClick={handleClaim}
          loading={isClaiming || isConfirming}
          className="w-full py-2.5"
        >
          {isClaiming || isConfirming ? t("claiming") : `${t("claim")} (${parseFloat(formatEther(claimable)).toFixed(4)} ETH)`}
        </GlowButton>
      )}
    </div>
  );
}
