import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Auth-gated page — no value indexing it, but keep follow so Google crawls links
export const metadata: Metadata = {
  title: "Dashboard — EscrowHubs Marketplace",
  robots: { index: false, follow: true },
};

export default function MarketplaceDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
