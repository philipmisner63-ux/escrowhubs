"use client";
import { useAccount, useReadContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CONTRACTS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import Link from "next/link";
import { formatUnits } from "viem";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { StatusCard } from "@/components/StatusCard";

const STATUS_BY_STATE = ["ACTIVE", "FUNDED", "RELEASED", "DISPUTED", "ACTIVE"] as const;

export default function EscrowsPage() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();
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
        <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3 text-white">👛</div>
          <p className="text-white/70 text-center mb-5">{t("escrows.notConnected")}</p>
          <Link
            href="/"
            className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold inline-block"
          >
            Open MiniPay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
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

      {!isLoading && allAddrs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-white/60 mb-6">{t("escrows.noPayments")}</p>
          <Link
            href="/create"
            className="tap-compress bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold inline-block shadow-lg shadow-green-900/30"
          >
            {t("escrows.ctaSendFirst")}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(allAddrs as string[]).map((escrowAddr, index) => (
          <EscrowCard
            key={escrowAddr}
            address={escrowAddr as `0x${string}`}
            myAddress={address!}
            sent={(sentAddrs as string[]).includes(escrowAddr)}
            index={index}
          />
        ))}
      </div>

      <TrustFooter />
    </main>
  );
}

function EscrowCard({
  address: escrowAddr,
  myAddress,
  sent,
  index,
}: {
  address: `0x${string}`;
  myAddress: `0x${string}`;
  sent: boolean;
  index: number;
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

  const { data: beneficiary } = useReadContract({
    address: escrowAddr,
    abi: [{ name: "beneficiary", type: "function", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" }],
    functionName: "beneficiary",
  });

  const stateNum = typeof state === "number" ? state : Number(state ?? 0);
  const status = STATUS_BY_STATE[stateNum] ?? STATUS_BY_STATE[0];
  const amountFormatted = amount
    ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2)
    : "...";
  const recipientAddress = (beneficiary as string | undefined) ?? myAddress;
  const recipient = `${sent ? "To" : "From"} ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}`;

  return (
    <StatusCard
      status={status}
      amount={`${amountFormatted} cUSD`}
      description="Payment"
      recipient={recipient}
      href={`/escrow/${escrowAddr}`}
      className={`slide-in-${Math.min(index + 1, 4)}`}
    />
  );
}
