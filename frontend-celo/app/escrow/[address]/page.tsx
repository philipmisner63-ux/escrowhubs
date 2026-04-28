"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatUnits } from "viem";
import Link from "next/link";
import { use, useState } from "react";
import SimpleEscrowABI from "@/abis/SimpleEscrow.json";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { USDT } from "@/lib/config";

const STATE = { PENDING: 0, FUNDED: 1, RELEASED: 2, DISPUTED: 3, REFUNDED: 4 };

// State index → translation key
const STATE_KEYS = ["awaitingDeposit", "funded", "released", "disputed", "refunded"] as const;
const STATE_EMOJIS = ["⏳", "🔒", "✅", "⚖️", "↩️"] as const;
const STATE_GRADIENT = [
  "from-[#35D07F]/20 to-[#0EA56F]/10 border-[#35D07F]/30",
  "from-[#35D07F]/20 to-[#0EA56F]/10 border-[#35D07F]/30",
  "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "from-red-500/20 to-red-600/10 border-red-500/30",
  "from-red-500/20 to-red-600/10 border-red-500/30",
] as const;
const STATE_AMOUNT_COLOR = [
  "text-[#35D07F]",
  "text-[#35D07F]",
  "text-blue-400",
  "text-red-400",
  "text-red-400",
] as const;

const ESCROW_ABI = SimpleEscrowABI as any;

export default function EscrowDetailPage({ params }: { params: Promise<{ address: `0x${string}` }> }) {
  const { address: escrowAddr } = use(params);
  const { address: myAddress } = useAccount();
  const { t } = useTranslation();
  useMiniPay();

  const [txError, setTxError] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { data: state, refetch: refetchState } = useReadContract({
    address: escrowAddr,
    abi: ESCROW_ABI,
    functionName: "state",
  });

  const { data: amount } = useReadContract({
    address: escrowAddr,
    abi: ESCROW_ABI,
    functionName: "amount",
  });

  const { data: tokenAddress } = useReadContract({
    address: escrowAddr,
    abi: ESCROW_ABI,
    functionName: "token",
  });

  const { data: depositor } = useReadContract({
    address: escrowAddr,
    abi: ESCROW_ABI,
    functionName: "depositor",
  });

  const { data: beneficiary } = useReadContract({
    address: escrowAddr,
    abi: ESCROW_ABI,
    functionName: "beneficiary",
  });

  const isUSDT = (tokenAddress as string | undefined)?.toLowerCase() === USDT.toLowerCase();
  const tokenSymbol = isUSDT ? "USDT" : "cUSD";
  const tokenDecimals = isUSDT ? 6 : 18;

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  const stateKey = STATE_KEYS[stateNum] ?? STATE_KEYS[0];
  const stateEmoji = STATE_EMOJIS[stateNum] ?? STATE_EMOJIS[0];
  const stateGradient = STATE_GRADIENT[stateNum] ?? STATE_GRADIENT[0];
  const amountColor = STATE_AMOUNT_COLOR[stateNum] ?? STATE_AMOUNT_COLOR[0];
  const stateLabel = t(`escrowDetail.stateLabels.${stateKey}`);
  const stateDesc = t(`escrowDetail.stateDescriptions.${stateKey}`);
  const amountFormatted = amount
    ? parseFloat(formatUnits(amount as bigint, tokenDecimals)).toFixed(2)
    : "...";

  const isDepositor = myAddress?.toLowerCase() === (depositor as string)?.toLowerCase();
  const isBeneficiary = myAddress?.toLowerCase() === (beneficiary as string)?.toLowerCase();
  const isFunded = stateNum === STATE.FUNDED;

  async function handleRelease() {
    setTxError("");
    setReleasing(true);
    try {
      await writeContractAsync({
        address: escrowAddr,
        abi: ESCROW_ABI,
        functionName: "release",
        gas: 200000n,
      });
      await refetchState();
    } catch (e: any) {
      setTxError(e?.shortMessage ?? e?.message ?? t("escrowDetail.errorGeneric"));
    } finally {
      setReleasing(false);
    }
  }

  async function handleDispute() {
    setTxError("");
    setDisputing(true);
    try {
      await writeContractAsync({
        address: escrowAddr,
        abi: ESCROW_ABI,
        functionName: "dispute",
        gas: 200000n,
      });
      await refetchState();
    } catch (e: any) {
      setTxError(e?.shortMessage ?? e?.message ?? t("escrowDetail.errorGeneric"));
    } finally {
      setDisputing(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto">
      <Link href="/escrows" className="text-white/60 text-sm mb-6 flex items-center gap-1">
        {t("escrowDetail.backToPayments")}
      </Link>

      {/* Status hero card */}
      <div className={`bg-gradient-to-br ${stateGradient} border rounded-2xl p-6 mb-6 text-center`}>
        <div className="text-5xl mb-3">{stateEmoji}</div>
        <h1 className="text-xl font-bold text-white mb-1">{stateLabel}</h1>
        <p className="text-white/60 text-sm">{stateDesc}</p>
      </div>

      {/* Amount card */}
      <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-5 mb-4 text-center">
        <p className="text-white/60 text-sm mb-1">{t("escrowDetail.amountLabel")}</p>
        <p className={`text-4xl font-bold ${amountColor}`}>{amountFormatted}</p>
        <p className="text-white/40 text-sm">{tokenSymbol}</p>
      </div>

      {/* Parties card */}
      <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-5 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">{t("escrowDetail.senderLabel")}</span>
            <span className="text-sm font-mono text-white">
              {(depositor as string)?.slice(0, 8)}...{(depositor as string)?.slice(-6)}
              {isDepositor && (
                <span className="ml-1 text-[#35D07F] text-xs">{t("escrowDetail.you")}</span>
              )}
            </span>
          </div>
          <div className="border-t border-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">{t("escrowDetail.recipientLabel")}</span>
            <span className="text-sm font-mono text-white">
              {(beneficiary as string)?.slice(0, 8)}...{(beneficiary as string)?.slice(-6)}
              {isBeneficiary && (
                <span className="ml-1 text-[#35D07F] text-xs">{t("escrowDetail.you")}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {txError && (
        <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 rounded-xl px-4 py-3 text-sm text-[#FF5B5B] mb-4">
          {txError}
        </div>
      )}

      {/* Actions — only shown when funded and you're the depositor */}
      {isFunded && isDepositor && (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRelease}
            disabled={releasing || disputing}
            className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 w-full font-bold disabled:opacity-50 shadow-lg shadow-green-900/30 flex items-center justify-center gap-2"
          >
            {releasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Releasing...
              </>
            ) : (
              t("escrowDetail.actionRelease")
            )}
          </button>

          <button
            onClick={handleDispute}
            disabled={releasing || disputing}
            className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl px-6 py-4 w-full font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {disputing ? (
              <>
                <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                Raising dispute...
              </>
            ) : (
              t("escrowDetail.actionDispute")
            )}
          </button>

          <p className="text-xs text-white/40 text-center px-4">{t("escrowDetail.disputeNote")}</p>
        </div>
      )}

      {/* Recipient view — funded */}
      {isFunded && isBeneficiary && (
        <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-[#4A9EFF] font-medium mb-1">Funds are locked</p>
          <p className="text-white/60 text-sm">{t("escrowDetail.beneficiaryInfo")}</p>
        </div>
      )}

      {/* Contract link */}
      <div className="mt-6">
        <a
          href={`https://celoscan.io/address/${escrowAddr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/40 text-center block"
        >
          {t("escrowDetail.viewOnCeloscan")} ↗
        </a>
      </div>

      <TrustFooter />
    </main>
  );
}
