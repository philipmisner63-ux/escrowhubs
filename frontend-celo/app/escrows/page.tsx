"use client";
import { useAccount, useReadContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CONTRACTS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import Link from "next/link";
import { formatUnits } from "viem";

// Escrow states from contract
const STATE_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  0: { label: "Awaiting deposit",  color: "bg-gray-100 text-gray-600",   emoji: "⏳" },
  1: { label: "Funded",            color: "bg-blue-100 text-blue-700",    emoji: "🔒" },
  2: { label: "Released",          color: "bg-green-100 text-green-700",  emoji: "✅" },
  3: { label: "Disputed",          color: "bg-amber-100 text-amber-700",  emoji: "⚖️" },
  4: { label: "Refunded",          color: "bg-red-100 text-red-700",      emoji: "↩️" },
};

export default function EscrowsPage() {
  const { address, isConnected } = useAccount();
  useMiniPay();

  const { data: sentAddrs = [], isLoading: loadingSent } = useReadContract({
    address: CONTRACTS.factory,
    abi: FactoryABI,
    functionName: "getEscrowsByDepositor",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: receivedAddrs = [], isLoading: loadingReceived } = useReadContract({
    address: CONTRACTS.factory,
    abi: FactoryABI,
    functionName: "getEscrowsByBeneficiary",
    args: [address!],
    query: { enabled: !!address },
  });

  const isLoading = loadingSent || loadingReceived;
  const allAddrs = [...new Set([...(sentAddrs as string[]), ...(receivedAddrs as string[])])];

  if (!isConnected) {
    return (
      <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto items-center justify-center">
        <div className="text-4xl mb-3">👛</div>
        <p className="text-gray-600 text-center">Open this app in MiniPay to see your payments</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/" className="text-gray-500 text-sm mb-6 flex items-center gap-1">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Payments</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && allAddrs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 mb-6">No payments yet</p>
          <Link
            href="/create"
            className="bg-green-600 text-white rounded-2xl px-6 py-4 font-semibold inline-block"
          >
            Send a safe payment
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(allAddrs as string[]).map((escrowAddr) => (
          <EscrowCard
            key={escrowAddr}
            address={escrowAddr as `0x${string}`}
            myAddress={address!}
            sent={(sentAddrs as string[]).includes(escrowAddr)}
          />
        ))}
      </div>
    </main>
  );
}

function EscrowCard({
  address: escrowAddr,
  myAddress,
  sent,
}: {
  address: `0x${string}`;
  myAddress: `0x${string}`;
  sent: boolean;
}) {
  const { data: state } = useReadContract({
    address: escrowAddr,
    abi: [{ name: "state", type: "function", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" }],
    functionName: "state",
  });

  const { data: amount } = useReadContract({
    address: escrowAddr,
    abi: [{ name: "amount", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "amount",
  });

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  const { label, color, emoji } = STATE_LABELS[stateNum] ?? STATE_LABELS[0];
  const amountFormatted = amount ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2) : "...";

  return (
    <Link href={`/escrow/${escrowAddr}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between active:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {sent ? "Sent" : "Received"} · {amountFormatted} cUSD
            </p>
            <p className="text-xs text-gray-400">
              {escrowAddr.slice(0, 8)}...{escrowAddr.slice(-6)}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${color}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}
