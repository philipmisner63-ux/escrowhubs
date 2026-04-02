"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { cn } from "@/lib/utils";

const LEARN_LINKS = [
  { href: "/learn",              label: "Overview",       icon: "📖" },
  { href: "/learn/onboarding",   label: "Onboarding",     icon: "🚀" },
  { href: "/learn/how-it-works", label: "How It Works",   icon: "⚙️"  },
  { href: "/learn/escrow-flow",  label: "Escrow Flow",    icon: "📊" },
  { href: "/learn/global-flow",  label: "Global Flow",    icon: "🗺️"  },
  { href: "/learn/faq",          label: "FAQ",            icon: "❓" },
  { href: "/learn/mock-escrow",  label: "Mock Escrow",    icon: "📋" },
  { href: "/learn/role-view",    label: "Role View",      icon: "👥" },
  { href: "/learn/network-sim",  label: "Network Sim",    icon: "🌐" },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-white/8 bg-black/30">
          <div className="px-4 py-5 border-b border-white/8">
            <h2 className="text-sm font-bold text-white">Learn</h2>
            <p className="text-xs text-slate-500 mt-0.5">Guides & interactive demos</p>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {LEARN_LINKS.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  pathname === href
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full border-b border-white/8 bg-black/30 overflow-x-auto">
          <div className="flex gap-1 px-3 py-2">
            {LEARN_LINKS.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all shrink-0",
                  pathname === href
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
