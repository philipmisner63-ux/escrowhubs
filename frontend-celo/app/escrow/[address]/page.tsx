"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatUnits } from "viem";
import Link from "next/link";
import { useState } from "react";
import SimpleEscrowABI from "@/abis/SimpleEscrow.json";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";

const STATE = { PENDING: 0, FUNDED: 1, RELEASED: 2, DISPUTED: 3, REFUNDED: 4 };

// State index → translation key
const STATE_KEYS = ["awaitingDeposit", "funded", "released", "disputed", "refunded"] as const;
const STATE_EMOJIS = ["⏳", "🔒", "✅", "⚖️", "↩️"] as const;
const STATE_BG = ["bg-gray-50", "bg-blue-50", "bg-green-50", "bg-amber-50", "bg-red-50"] as const;

const ESCROW_ABI = SimpleEscrowABI as any;

export default function EscrowDetailPage({ params }: { params: { address: `0x${string}` } }) {
  const { address: escrowAddr } = params;
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

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  const stateKey = STATE_KEYS[stateNum] ?? STATE_KEYS[0];
  const stateEmoji = STATE_EMOJIS[stateNum] ?? STATE_EMOJIS[0];
  const stateBg = STATE_BG[stateNum] ?? STATE_BG[0];
  const stateLabel = t(`escrowDetail.stateLabels.${stateKey}`);
  const stateDesc = t(`escrowDetail.stateDescriptions.${stateKey}`);
  const amountFormatted = amount
    ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2)
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
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/escrows" className="text-gray-500 text-sm mb-6 flex items-center gap-1">
        {t("escrowDetail.backToPayments")}
      </Link>

      {/* Status card */}
      <div className={`${stateBg} rounded-2xl p-6 mb-6 text-center`}>
        <div className="text-5xl mb-3">{stateEmoji}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{stateLabel}</h1>
        <p className="text-gray-500 text-sm">{stateDesc}</p>
      </div>

      {/* Amount */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 text-center">
        <p className="text-gray-500 text-sm mb-1">{t("escrowDetail.amountLabel")}</p>
        <p className="text-4xl font-bold text-gray-900">{amountFormatted}</p>
        <p className="text-gray-400 text-sm">cUSD</p>
      </div>

      {/* Parties */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{t("escrowDetail.senderLabel")}</span>
            <span className="text-sm font-mono text-gray-800">
              {(depositor as string)?.slice(0, 8)}...{(depositor as string)?.slice(-6)}
              {isDepositor && (
                <span className="ml-1 text-green-600 text-xs">{t("escrowDetail.you")}</span>
              )}
            </span>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{t("escrowDetail.recipientLabel")}</span>
            <span className="text-sm font-mono text-gray-800">
              {(beneficiary as string)?.slice(0, 8)}...{(beneficiary as string)?.slice(-6)}
              {isBeneficiary && (
                <span className="ml-1 text-green-600 text-xs">{t("escrowDetail.you")}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {txError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
          {txError}
        </div>
      )}

      {/* Actions — only shown when funded and you're the depositor */}
      {isFunded && isDepositor && (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRelease}
            disabled={releasing || disputing}
            className="bg-green-600 text-white rounded-2xl px-6 py-5 font-semibold text-lg disabled:opacity-50 active:bg-green-700 transition-colors flex items-center justify-center gap-2"
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
            className="bg-white border-2 border-amber-300 text-amber-700 rounded-2xl px-6 py-4 font-semibold disabled:opacity-50 active:bg-amber-50 transition-colors flex items-center justify-center gap-2"
          >
            {disputing ? (
              <>
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Raising dispute...
              </>
            ) : (
              t("escrowDetail.actionDispute")
            )}
          </button>

          <p className="text-xs text-gray-400 text-center px-4">{t("escrowDetail.disputeNote")}</p>
        </div>
      )}

      {/* Recipient view — funded */}
      {isFunded && isBeneficiary && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-blue-800 font-medium mb-1">Funds are locked</p>
          <p className="text-blue-600 text-sm">{t("escrowDetail.beneficiaryInfo")}</p>
        </div>
      )}

      {/* Contract link */}
      <div className="mt-6">
        <a
          href={`https://celoscan.io/address/${escrowAddr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 text-center block"
        >
          {t("escrowDetail.viewOnCeloscan")} ↗
        </a>
      </div>

      <TrustFooter />
    </main>
  );
}
