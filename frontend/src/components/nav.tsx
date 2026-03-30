"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/create", label: "Create Escrow" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 border-b border-white/8 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(0,245,255,0.5)]" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">BlockDAG</span>
                <span className="ml-1 text-cyan-400">Escrow</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === href
                      ? "text-cyan-400 bg-cyan-400/10 shadow-[inset_0_0_20px_rgba(0,245,255,0.05)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect Wallet */}
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="avatar"
          />
        </div>
      </div>
    </nav>
  );
}
