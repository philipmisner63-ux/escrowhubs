"use client";
import { useAccount, useReadContract } from "wagmi";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CONTRACTS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import Link from "next/link";
import { formatUnits } from "viem";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";

// State index → translation key
const STATE_KEYS = ["awaitingDeposit", "funded", "released", "disputed", "refunded"] as const;
const STATE_EMOJIS = ["⏳", "🔒", "✅", "⚖️", "↩️"] as const;
const STATE_BORDER = ["#F7C948", "#35D07F", "#4A9EFF", "#FF5B5B", "#FF5B5B"] as const;
const STATE_BADGE = [
  "bg-[#F7C948]/20 text-[#F7C948]",
  "bg-[#35D07F]/20 text-[#35D07F]",
  "bg-[#4A9EFF]/20 text-[#4A9EFF]",
  "bg-[#FF5B5B]/20 text-[#FF5B5B]",
  "bg-[#FF5B5B]/20 text-[#FF5B5B]",
] as const;

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
        <div className="text-4xl mb-3">👛</div>
        <p className="text-white/60 text-center">{t("escrows.notConnected")}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link href="/" className="text-white/60 text-sm mb-6 flex items-center gap-1">
        {t("back")}
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">{t("escrows.pageTitle")}</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.07] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
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
            className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-4 font-bold inline-block shadow-lg shadow-green-900/30"
          >
            {t("escrows.ctaSendFirst")}
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

      <TrustFooter />
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
  const { t } = useTranslation();

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
  const stateKey = STATE_KEYS[stateNum] ?? STATE_KEYS[0];
  const label = t(`escrows.stateLabels.${stateKey}`);
  const emoji = STATE_EMOJIS[stateNum] ?? STATE_EMOJIS[0];
  const borderColor = STATE_BORDER[stateNum] ?? STATE_BORDER[0];
  const badgeClass = STATE_BADGE[stateNum] ?? STATE_BADGE[0];
  const amountFormatted = amount
    ? parseFloat(formatUnits(amount as bigint, 18)).toFixed(2)
    : "...";

  return (
    <Link href={`/escrow/${escrowAddr}`}>
      <div className="relative bg-white/[0.07] border border-white/10 rounded-2xl overflow-hidden active:bg-white/10 transition-colors">
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: borderColor }} />
        <div className="p-4 pl-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="text-sm font-bold text-white">
                {amountFormatted} cUSD
              </p>
              <p className="text-xs text-white/50">
                {sent ? t("escrows.sent") : t("escrows.received")} · {escrowAddr.slice(0, 8)}...{escrowAddr.slice(-6)}
              </p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${badgeClass}`}>{label}</span>
        </div>
      </div>
    </Link>
  );
}
