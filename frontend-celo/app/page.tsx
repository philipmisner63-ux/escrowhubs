"use client";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CUSD } from "@/lib/config";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { Tile } from "@/components/Tile";
import { IconCircle } from "@/components/IconCircle";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isMiniPay, detected } = useMiniPay();
  const { t, lang, setLang } = useTranslation();

  const { data: cUSDBalance } = useReadContract({
    address: CUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address && isConnected },
  });
  const balanceFormatted =
    cUSDBalance != null
      ? parseFloat(formatUnits(cUSDBalance as bigint, 18)).toFixed(2)
      : null;

  const STEPS = [
    { icon: "🔒", title: t("home.steps.lockFunds.title"), desc: t("home.steps.lockFunds.desc") },
    { icon: "🛠️", title: t("home.steps.jobDone.title"), desc: t("home.steps.jobDone.desc") },
    { icon: "💸", title: t("home.steps.releasePayment.title"), desc: t("home.steps.releasePayment.desc") },
    { icon: "⚖️", title: t("home.steps.dispute.title"), desc: t("home.steps.dispute.desc") },
  ];

  const langPicker = (
    <div className="flex items-center gap-1 bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full">
      <button
        onClick={() => setLang("en")}
        className={`tap-compress text-xs font-semibold px-1 transition-colors ${lang === "en" ? "text-[#35D07F]" : "text-white/50"}`}
        aria-label="English"
      >
        EN
      </button>
      <span className="text-white/30 text-xs">|</span>
      <button
        onClick={() => setLang("sw")}
        className={`tap-compress text-xs font-semibold px-1 transition-colors ${lang === "sw" ? "text-[#35D07F]" : "text-white/50"}`}
        aria-label="Swahili"
      >
        SW
      </button>
    </div>
  );

  const howItWorks = (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
      <h2 className="font-semibold text-white mb-4">{t("home.howItWorksTitle")}</h2>
      <div className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <div key={step.title} className="flex gap-3 items-start slide-in">
            <IconCircle icon={step.icon} size="sm" />
            <div>
              <p className="font-medium text-white text-sm">{step.title}</p>
              <p className="text-white/60 text-xs">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Non-MiniPay: show explainer layout
  if (detected && !isMiniPay) {
    return (
      <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">EscrowHubs 🟢</h1>
            <p className="text-white/60 text-sm mt-1">{t("home.tagline")}</p>
          </div>
          {langPicker}
        </div>

        <div className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] gradient-motion rounded-2xl p-6 text-white mb-6">
          <p className="text-white font-bold text-lg mb-1">Safe payments for Africa</p>
          <p className="text-white/80 text-sm">
            Funds held by smart contract until both sides agree
          </p>
        </div>

        {howItWorks}

        <a
          href="https://minipay.opera.com/open?url=https://celo.escrowhubs.io"
          className="tap-compress btn-pulse bg-gradient-to-r from-[#35D07F] to-[#0EA56F] text-white rounded-2xl px-6 py-5 text-center font-bold text-lg shadow-lg shadow-green-900/30 mb-4 block"
        >
          Open in MiniPay
        </a>
        <Link href="/demo" className="tap-compress text-center text-white/50 text-sm mb-6 block">
          Try Demo →
        </Link>

        <TrustFooter />
      </main>
    );
  }

  // MiniPay (or pre-detection) layout
  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">EscrowHubs 🟢</h1>
          <p className="text-white/60 text-sm mt-1">{t("home.tagline")}</p>
        </div>
        {langPicker}
      </div>

      {/* Wallet status */}
      {detected && (
        <div className="mb-6">
          {isConnected ? (
            <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 border-l-4 border-l-[#35D07F] rounded-2xl p-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#35D07F]" />
                  <span className="text-sm text-white font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)} · Celo
                  </span>
                </div>
                {balanceFormatted !== null ? (
                  <>
                    <p className="text-3xl font-bold text-[#35D07F]">{balanceFormatted}</p>
                    <p className="text-white/60 text-xs mt-0.5">cUSD</p>
                  </>
                ) : (
                  <div className="skeleton h-9 w-28 mt-1" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-white/80">
                  {isMiniPay ? t("home.walletConnecting") : t("home.walletOpenInMiniPay")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Tile icon="💸" title="Send a Safe Payment" subtitle="Funds held until done →" href="/create" className="slide-in-1" />
        <Tile icon="📋" title="My Payments" subtitle="Track & release →" href="/escrows" className="slide-in-2" />
      </div>

      {howItWorks}

      <TrustFooter />
    </main>
  );
}
