"use client";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { TOKENS } from "@/lib/config";
import Link from "next/link";
import { useTranslation, type Lang } from "@/lib/useTranslation";
import { TrustFooter } from "@/components/TrustFooter";
import { Tile } from "@/components/Tile";
import { IconCircle } from "@/components/IconCircle";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isMiniPay, detected } = useMiniPay();
  const { t, lang, setLang } = useTranslation();

  const { data: cUSDBalance } = useReadContract({
    address: TOKENS.cUSD.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address && isConnected },
  });
  const { data: usdtBalance } = useReadContract({
    address: TOKENS.USDT.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address && isConnected },
  });
  const cUSDFormatted =
    cUSDBalance != null
      ? parseFloat(formatUnits(cUSDBalance as bigint, 18)).toFixed(2)
      : null;
  const usdtFormatted =
    usdtBalance != null
      ? parseFloat(formatUnits(usdtBalance as bigint, 6)).toFixed(2)
      : null;

  const STEPS = [
    { icon: "🔒", title: t("home.steps.lockFunds.title"), desc: t("home.steps.lockFunds.desc") },
    { icon: "🛠️", title: t("home.steps.jobDone.title"), desc: t("home.steps.jobDone.desc") },
    { icon: "💸", title: t("home.steps.releasePayment.title"), desc: t("home.steps.releasePayment.desc") },
    { icon: "⚖️", title: t("home.steps.dispute.title"), desc: t("home.steps.dispute.desc") },
  ];

  const LANGS: { code: Lang; label: string; aria: string }[] = [
    { code: "en", label: "EN", aria: "English" },
    { code: "sw", label: "SW", aria: "Swahili" },
    { code: "es", label: "ES", aria: "Español" },
    { code: "pt", label: "PT", aria: "Português" },
    { code: "fr", label: "FR", aria: "Français" },
    { code: "ar", label: "AR", aria: "العربية" },
    { code: "hi", label: "हि", aria: "हिंदी" },
    { code: "zh", label: "中", aria: "中文" },
  ];

  const langPicker = (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {LANGS.map(({ code, label, aria }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-label={aria}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full tap-compress transition-colors border ${
            lang === code
              ? "bg-[#35D07F] text-black border-[#35D07F]"
              : "bg-white/10 text-white/50 border-white/20"
          }`}
        >
          {label}
        </button>
      ))}
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
      <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">EscrowHubs 🟢</h1>
            <p className="text-white/60 text-sm mt-1">{t("home.tagline")}</p>
          </div>
          {langPicker}
        </div>

        <div className="bg-gradient-to-r from-[#35D07F] to-[#0EA56F] gradient-motion rounded-2xl p-6 text-white mb-6">
          <p className="text-white font-bold text-lg mb-1">{t("home.tagline")}</p>
          <p className="text-white/80 text-sm">
            {t("home.explainer.trustLine")}
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
    <main className="flex flex-col min-h-screen px-5 pt-8 pb-20 max-w-md mx-auto">
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
                {cUSDFormatted !== null ? (
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div>
                      <p className="text-3xl font-bold text-[#35D07F]">{cUSDFormatted}</p>
                      <p className="text-white/60 text-xs mt-0.5">cUSD</p>
                    </div>
                    {usdtFormatted !== null && (
                      <div>
                        <p className="text-2xl font-bold text-white/70">{usdtFormatted}</p>
                        <p className="text-white/40 text-xs mt-0.5">USDT</p>
                      </div>
                    )}
                  </div>
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
