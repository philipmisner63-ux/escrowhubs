"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAccount, useChainId } from "wagmi";
import { WalletConnectButton } from "@/components/connect-button";
import { LanguagePicker } from "@/components/language-picker";
import { LanguagePickerMobile } from "@/components/language-picker-mobile";
import { cn } from "@/lib/utils";
import { DEFAULT_CHAIN_ID, getChain } from "@/lib/chainRegistry";
function WalletWarningBanner() {
  const t = useTranslations("nav");
  const { isConnected } = useAccount();
  const chainId = useChainId();
  if (!isConnected) return null;
  if (chainId !== DEFAULT_CHAIN_ID) {
    const target = getChain(DEFAULT_CHAIN_ID);
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-xs text-yellow-300">
        ⚠️ {t("wrongNetwork", { name: target.chain.name, chainId: DEFAULT_CHAIN_ID })}
      </div>
    );
  }
  return null;
}
export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  // Strip locale prefix for active link matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/";
  const navLinks = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/create",    label: t("create")    },
    { href: "/learn",     label: t("learn")     },
  ];
  return (
    <nav className="sticky top-0 z-40 border-white/8 bg-black/50 backdrop-blur-xl">
      <WalletWarningBanner />
      <div className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(0,245,255,0.5)] group-hover:shadow-[0_0_25px_rgba(0,245,255,0.7)] transition-shadow" />
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-white">BlockDAG</span>
                  <span className="ms-1" style={{ color: "#00f5ff", textShadow: "0 0 10px rgba(0,245,255,0.6)" }}>
                    Escrow
                  </span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      pathWithoutLocale === href || pathWithoutLocale.startsWith(href)
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Right side */}
            <div className="flex items-center gap-2">
              <LanguagePicker />
              <LanguagePickerMobile />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
