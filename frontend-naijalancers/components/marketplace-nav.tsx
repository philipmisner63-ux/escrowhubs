"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/session-provider";
import { GoogleSignInButton } from "./google-signin";

export function MarketplaceNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, signOut } = useSession();

  const links = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/create", label: "Request Payment" },
    { href: "/dashboard", label: "My Payments" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-white/8 bg-black/50 backdrop-blur-xl">
      <div className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/marketplace" className="flex items-center gap-2.5 group">
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-white">Naija</span>
                  <span
                    className="ms-1"
                    style={{ color: "#00f5ff", textShadow: "0 0 10px rgba(0,245,255,0.6)" }}
                  >
                    Lancers
                  </span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs text-white font-medium">
                      {session.name || session.email.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 border border-slate-600/40 hover:text-white hover:border-slate-400/60 transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="hidden sm:block">
                  <GoogleSignInButton />
                </div>
              )}

              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden py-3 border-t border-white/8 space-y-2">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5"
                >
                  {label}
                </Link>
              ))}
              {!session && (
                <div className="px-4 py-2">
                  <GoogleSignInButton />
                </div>
              )}
              {session && (
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
