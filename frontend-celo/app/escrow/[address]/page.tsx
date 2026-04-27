"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { formatUnits } from "viem";
import Link from "next/link";
import { useState } from "react";
import SimpleEscrowABI from "@/abis/SimpleEscrow.json";

const STATE = { PENDING: 0, FUNDED: 1, RELEASED: 2, DISPUTED: 3, REFUNDED: 4 };

const STATE_UI: Record<number, { label: string; desc: string; emoji: string; bg: string }> = {
  0: { label: "Awaiting deposit",  desc: "Funds haven't been deposited yet",         emoji: "⏳", bg: "bg-gray-50" },
  1: { label: "Funds locked",      desc: "cUSD is held safely in the smart contract", emoji: "🔒", bg: "bg-blue-50" },
  2: { label: "Payment released",  desc: "The payment was sent to the recipient",     emoji: "✅", bg: "bg-green-50" },
  3: { label: "Under dispute",     desc: "The AI arbiter is reviewing this payment",  emoji: "⚖️", bg: "bg-amber-50" },
  4: { label: "Refunded",          desc: "The funds were returned to the sender",     emoji: "↩️", bg: "bg-red-50" },
};

const ESCROW_ABI = SimpleEscrowABI as any;

export default function EscrowDetailPage({ params }: { params: { address: `0x${string}` } }) {
  const { address: escrowAddr } = params;
  const { address: myAddress, isConnected } = useAccount();
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
  const stateUI = STATE_UI[stateNum] ?? STATE_UI[0];
  const amountFormatted = amount ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2) : "...";

  const isDepositor  = myAddress?.toLowerCase() === (depositor as string)?.toLowerCase();
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
      setTxError(e?.shortMessage ?? e?.message ?? "Transaction failed");
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
      setTxError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setDisputing(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/escrows" className="text-gray-500 text-sm mb-6 flex items-center gap-1">← My Payments</Link>

      {/* Status card */}
      <div className={`${stateUI.bg} rounded-2xl p-6 mb-6 text-center`}>
        <div className="text-5xl mb-3">{stateUI.emoji}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{stateUI.label}</h1>
        <p className="text-gray-500 text-sm">{stateUI.desc}</p>
      </div>

      {/* Amount */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 text-center">
        <p className="text-gray-500 text-sm mb-1">Amount</p>
        <p className="text-4xl font-bold text-gray-900">{amountFormatted}</p>
        <p className="text-gray-400 text-sm">cUSD</p>
      </div>

      {/* Parties */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Sender</span>
            <span className="text-sm font-mono text-gray-800">
              {(depositor as string)?.slice(0, 8)}...{(depositor as string)?.slice(-6)}
              {isDepositor && <span className="ml-1 text-green-600 text-xs">(you)</span>}
            </span>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Recipient</span>
            <span className="text-sm font-mono text-gray-800">
              {(beneficiary as string)?.slice(0, 8)}...{(beneficiary as string)?.slice(-6)}
              {isBeneficiary && <span className="ml-1 text-green-600 text-xs">(you)</span>}
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
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Releasing...</>
            ) : (
              "✅ Job done — Release payment"
            )}
          </button>

          <button
            onClick={handleDispute}
            disabled={releasing || disputing}
            className="bg-white border-2 border-amber-300 text-amber-700 rounded-2xl px-6 py-4 font-semibold disabled:opacity-50 active:bg-amber-50 transition-colors flex items-center justify-center gap-2"
          >
            {disputing ? (
              <><div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> Raising dispute...</>
            ) : (
              "⚖️ Problem? Raise a dispute"
            )}
          </button>

          <p className="text-xs text-gray-400 text-center px-4">
            Raising a dispute sends this to our AI arbiter for a fair review
          </p>
        </div>
      )}

      {/* Recipient view — funded */}
      {isFunded && isBeneficiary && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-blue-800 font-medium mb-1">Funds are locked</p>
          <p className="text-blue-600 text-sm">Complete the job and ask the sender to release payment</p>
        </div>
      )}

      {/* Contract link */}
      <div className="mt-auto pt-6">
        <a
          href={`https://celoscan.io/address/${escrowAddr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 text-center block"
        >
          View on Celoscan ↗
        </a>
      </div>
    </main>
  );
}
