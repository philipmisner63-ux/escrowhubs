"use client";

/**
 * MarketplaceNav — wallet-free navigation for marketplace routes.
 * Zero RainbowKit, zero Wagmi, zero WalletConnect, zero SES.
 * Must stay completely isolated from the main app wallet ecosystem.
 */

import BrandLogo from "@/components/BrandLogo";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguagePicker } from "@/components/language-picker";
import { LanguagePickerMobile } from "@/components/language-picker-mobile";
import { cn } from "@/lib/utils";
import { usePrivy } from "@/components/privy-provider";

export function MarketplaceNav() {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/";

  const { authenticated, login, logout, user, ready } = usePrivy();

  const marketplaceLinks = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/marketplace/dashboard", label: "My Escrows" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-white/8 bg-black/50 backdrop-blur-xl">
      <div className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
                <BrandLogo size={36} animated={false} showTagline={false} />
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-white">Escrow</span>
                  <span className="ms-1" style={{ color: "#00f5ff", textShadow: "0 0 10px rgba(0,245,255,0.6)" }}>
                    Hubs
                  </span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {marketplaceLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/")
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side — Web3Auth login/logout, no wallet UI */}
            <div className="flex items-center gap-2">
              <LanguagePicker />
              {ready && (
                authenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-xs text-slate-400 truncate max-w-[140px]">
                      {user?.email ?? user?.phone ?? "Signed in"}
                    </span>
                    <button
                      onClick={logout}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 border border-slate-600/40 hover:text-white hover:border-slate-400/60 transition-all duration-200"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all duration-200"
                  >
                    Sign in
                  </button>
                )
              )}
              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden py-3 border-t border-white/8 space-y-1">
              {marketplaceLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathWithoutLocale === href
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {label}
                </Link>
              ))}
              <div className="px-4 pt-2">
                <LanguagePickerMobile />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
