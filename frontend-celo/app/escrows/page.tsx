"use client";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CONTRACTS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import Link from "next/link";
import { formatUnits } from "viem";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { StatusCard } from "@/components/StatusCard";

const ESCROW_STATE_NAMES = ["ACTIVE", "FUNDED", "RELEASED", "DISPUTED"] as const;

// Returns cUSD-formatted amount (decimals=18) or USDT (decimals=6)
// We use a simple heuristic: if amount > 1e15 it's likely 18-decimal, else 6
function formatAmount(amount: bigint, token: string): string {
  const isNativeOrCUSD = token === "0x0000000000000000000000000000000000000000"
    || token.toLowerCase() === "0x765de816845861e75a25fca122bb6898b8b1282a";
  const decimals = isNativeOrCUSD ? 18 : 6;
  return parseFloat(formatUnits(amount, decimals)).toFixed(2);
}

function tokenSymbol(token: string): string {
  if (token === "0x0000000000000000000000000000000000000000") return "CELO";
  if (token.toLowerCase() === "0x765de816845861e75a25fca122bb6898b8b1282a") return "cUSD";
  if (token.toLowerCase() === "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e") return "USDT";
  return "token";
}

export default function EscrowsPage() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();
  useMiniPay();

  // Step 1: get indices (uint256[]) for depositor and beneficiary
  const { data: sentIdxs = [], isLoading: loadingSent } = useReadContract({
    address: CONTRACTS.factory,
    abi: FactoryABI,
    functionName: "getEscrowsByDepositor",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: receivedIdxs = [], isLoading: loadingReceived } = useReadContract({
    address: CONTRACTS.factory,
    abi: FactoryABI,
    functionName: "getEscrowsByBeneficiary",
    args: [address!],
    query: { enabled: !!address },
  });

  // Merge unique indices
  const sentSet = new Set((sentIdxs as bigint[]).map(String));
  const allIdxs = [
    ...(sentIdxs as bigint[]),
    ...(receivedIdxs as bigint[]).filter(i => !sentSet.has(String(i))),
  ];

  // Step 2: batch-fetch each EscrowRecord from escrows(index)
  const { data: records = [], isLoading: loadingRecords } = useReadContracts({
    contracts: allIdxs.map(idx => ({
      address: CONTRACTS.factory,
      abi: FactoryABI as any,
      functionName: "escrows",
      args: [idx],
    })) as any,
    query: { enabled: allIdxs.length > 0 },
  });

  const isLoading = loadingSent || loadingReceived || loadingRecords;

  // Filter out zero-address or failed records
  const validRecords = records
    .map((r, i) => ({ result: r.result as any, idx: allIdxs[i], sent: sentSet.has(String(allIdxs[i])) }))
    .filter(r => r.result && r.result.contractAddress && r.result.contractAddress !== "0x0000000000000000000000000000000000000000");

  if (!isConnected) {
    return (
      <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto items-center justify-center">
        <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3 text-white">👛</div>
          <p className="text-white/70 text-center mb-5">{t("escrows.notConnected")}</p>
          <Link href="/" className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold inline-block">
            Open MiniPay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto">
      <Link href="/" className="tap-compress text-white/60 text-sm mb-6 flex items-center gap-1">
        {t("back")}
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">{t("escrows.pageTitle")}</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div>
                  <div className="skeleton h-4 w-36 rounded mb-2" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
              <div className="skeleton h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && validRecords.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-white/60 mb-6">{t("escrows.noPayments")}</p>
          <Link href="/create" className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold inline-block shadow-lg shadow-green-900/30">
            {t("escrows.ctaSendFirst")}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {validRecords.map(({ result, sent }, index) => {
          const stateNum = Number(result.escrowType ?? 0); // escrowType ≠ state but we read state from contract below
          const amt = formatAmount(result.totalAmount as bigint, result.token as string);
          const sym = tokenSymbol(result.token as string);
          const counterpart = sent
            ? `To ${(result.beneficiary as string).slice(0, 8)}...${(result.beneficiary as string).slice(-6)}`
            : `From ${(result.depositor as string).slice(0, 8)}...${(result.depositor as string).slice(-6)}`;

          return (
            <EscrowCard
              key={result.contractAddress}
              address={result.contractAddress as `0x${string}`}
              amount={`${amt} ${sym}`}
              counterpart={counterpart}
              index={index}
            />
          );
        })}
      </div>

      <TrustFooter />
    </main>
  );
}

function EscrowCard({
  address: escrowAddr,
  amount,
  counterpart,
  index,
}: {
  address: `0x${string}`;
  amount: string;
  counterpart: string;
  index: number;
}) {
  const { data: state } = useReadContract({
    address: escrowAddr,
    abi: [{ name: "state", type: "function", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" }],
    functionName: "state",
  });

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  // SimpleEscrow states: 0=AWAITING_PAYMENT, 1=AWAITING_DELIVERY, 2=COMPLETE, 3=DISPUTED
  const STATUS_MAP: Record<number, string> = { 0: "ACTIVE", 1: "FUNDED", 2: "RELEASED", 3: "DISPUTED" };
  const status = STATUS_MAP[stateNum] ?? "ACTIVE";

  return (
    <StatusCard
      status={status}
      amount={amount}
      description="Payment"
      recipient={counterpart}
      href={`/escrow/${escrowAddr}`}
      className={`slide-in-${Math.min(index + 1, 4)}`}
    />
  );
}
