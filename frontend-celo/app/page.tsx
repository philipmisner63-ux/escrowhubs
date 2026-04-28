"use client";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { CUSD } from "@/lib/config";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";

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
    { emoji: "🔒", title: t("home.steps.lockFunds.title"), desc: t("home.steps.lockFunds.desc") },
    { emoji: "✅", title: t("home.steps.jobDone.title"), desc: t("home.steps.jobDone.desc") },
    { emoji: "💚", title: t("home.steps.releasePayment.title"), desc: t("home.steps.releasePayment.desc") },
    { emoji: "⚖️", title: t("home.steps.dispute.title"), desc: t("home.steps.dispute.desc") },
  ];

  const langToggle = (
    <button
      onClick={() => setLang(lang === "en" ? "sw" : "en")}
      className="text-xs text-gray-400 font-medium px-2 py-1 rounded border border-gray-200 active:bg-gray-50 shrink-0"
      aria-label="Switch language"
    >
      {lang === "en" ? "SW" : "EN"}
    </button>
  );

  const howItWorks = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <h2 className="font-semibold text-gray-900 mb-4">{t("home.howItWorksTitle")}</h2>
      <div className="flex flex-col gap-3">
        {STEPS.map((step) => (
          <div key={step.title} className="flex gap-3 items-start">
            <span className="text-xl">{step.emoji}</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">{step.title}</p>
              <p className="text-gray-500 text-xs">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Non-MiniPay: show explainer layout
  if (!isMiniPay) {
    return (
      <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
        {/* Header with lang toggle */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("appName")}</h1>
            <p className="text-gray-500 text-sm mt-1">{t("home.explainer.tagline")}</p>
          </div>
          {langToggle}
        </div>

        {/* How it works — ABOVE CTAs for non-MiniPay */}
        {howItWorks}

        {/* Open in MiniPay */}
        <a
          href="https://minipay.opera.com/open?url=https://celo.escrowhubs.io"
          className="bg-green-600 text-white rounded-2xl px-6 py-5 text-center font-semibold text-lg active:bg-green-700 transition-colors shadow-sm mb-4 block"
        >
          {t("home.explainer.openInMiniPay")}
        </a>

        {/* Trust line */}
        <p className="text-center text-xs text-gray-500 mb-1">
          {t("home.explainer.trustLine")}
        </p>
        <p className="text-center text-xs mb-6">
          <a
            href="https://celoscan.io/address/0x43572a85597e82a7153dbcae8f2fe93d1602a836"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 underline"
          >
            View contract on Celoscan ↗
          </a>
        </p>

        {/* Try Demo */}
        <Link href="/demo" className="text-center text-xs text-gray-400 underline mb-4 block">
          {t("home.explainer.tryDemo")}
        </Link>

        <TrustFooter />
      </main>
    );
  }

  // MiniPay layout (current)
  return (
    <main className="flex flex-col min-h-screen px-5 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("appName")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("home.tagline")}</p>
        </div>
        {langToggle}
      </div>

      {/* Wallet status */}
      {detected && (
        <div className="mb-6">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div>
                <span className="text-sm text-green-800 font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)} · Celo
                </span>
                {balanceFormatted !== null && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {t("home.balanceLabel")} {balanceFormatted} cUSD
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800">
                {isMiniPay ? t("home.walletConnecting") : t("home.walletOpenInMiniPay")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main actions */}
      <div className="flex flex-col gap-4 mb-8">
        <Link
          href="/create"
          className="bg-green-600 text-white rounded-2xl px-6 py-5 text-center font-semibold text-lg active:bg-green-700 transition-colors shadow-sm"
        >
          {t("home.ctaSendPayment")}
        </Link>
        <Link
          href="/escrows"
          className="bg-white border-2 border-gray-200 text-gray-800 rounded-2xl px-6 py-5 text-center font-semibold text-lg active:bg-gray-50 transition-colors"
        >
          {t("home.ctaMyPayments")}
        </Link>
      </div>

      {/* How it works */}
      {howItWorks}

      <TrustFooter />
    </main>
  );
}
