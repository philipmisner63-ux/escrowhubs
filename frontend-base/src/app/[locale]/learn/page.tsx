import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Learn — EscrowHubs",
    "Interactive guides, escrow flow demos, and onboarding resources for EscrowHubs on Base.",
    "/learn",
    locale
  );
}

const PAGES = [
  { href: "/learn/onboarding",   label: "Onboarding Flow",    icon: "🚀", desc: "Step-by-step wallet connect and network switching guide" },
  { href: "/learn/how-it-works", label: "How It Works",       icon: "⚙️",  desc: "Animated flows for Simple, Milestone, and AI Arbiter escrows" },
  { href: "/learn/escrow-flow",  label: "Escrow Flow",        icon: "📊", desc: "Step-by-step animated view of the full escrow lifecycle" },
  { href: "/learn/global-flow",  label: "Global Flow",        icon: "🗺️",  desc: "Multi-party interaction diagrams and flow charts" },
  { href: "/learn/faq",          label: "FAQ",                icon: "❓", desc: "Common questions about escrow, fees, disputes, and wallets" },
  { href: "/learn/mock-escrow",  label: "Mock Escrow Viewer", icon: "📋", desc: "Interactive escrow detail preview with static data" },
  { href: "/learn/role-view",    label: "Role View",          icon: "👥", desc: "See how the UI changes for depositor, beneficiary, and arbiter" },
  { href: "/learn/network-sim",  label: "Network Simulator",  icon: "🌐", desc: "Simulate wallet connected, disconnected, and wrong-network states" },
];

export default function LearnIndexPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Learn EscrowHubs</h1>
        <p className="mt-2 text-slate-400">
          Interactive guides, flow diagrams, and role-based demos to help you understand how escrow works on Base.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PAGES.map(({ href, label, icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-white/8 bg-white/3 p-5 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{label}</h3>
            </div>
            <p className="text-sm text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
