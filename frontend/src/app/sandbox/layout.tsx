"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SANDBOX_LINKS = [
  { href: "/sandbox",              label: "Overview",      icon: "🧪" },
  { href: "/sandbox/onboarding",   label: "Onboarding",    icon: "🚀" },
  { href: "/sandbox/how-it-works", label: "How It Works",  icon: "⚙️"  },
  { href: "/sandbox/faq",          label: "FAQ",           icon: "❓" },
  { href: "/sandbox/mock-escrow",  label: "Mock Escrow",   icon: "📋" },
  { href: "/sandbox/role-view",    label: "Role View",     icon: "👥" },
  { href: "/sandbox/network-sim",  label: "Network Sim",   icon: "🌐" },
  { href: "/sandbox/global-flow",  label: "Global Flow",   icon: "🗺️"  },
];

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#060608] text-white">
      {/* Sandbox banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 font-medium tracking-wide">
        🧪 SANDBOX MODE — Local preview only. No real blockchain calls. No production code affected.
      </div>

      <div className="flex min-h-[calc(100vh-33px)]">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-white/8 bg-black/30 flex flex-col">
          <div className="px-4 py-5 border-b border-white/8">
            <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
              ← Back to App
            </Link>
            <h2 className="mt-3 text-sm font-bold text-white">Sandbox</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preview & Documentation</p>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {SANDBOX_LINKS.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  pathname === href
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-white/8">
            <p className="text-xs text-slate-600">EscrowHubs v1.0</p>
            <p className="text-xs text-slate-600">BlockDAG Chain 1404</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
