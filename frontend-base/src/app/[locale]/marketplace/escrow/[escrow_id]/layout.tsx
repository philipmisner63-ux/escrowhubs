import type { Metadata } from "next";

// Private escrow detail — not for indexing
export const metadata: Metadata = {
  title: "Escrow — EscrowHubs Marketplace",
  robots: { index: false, follow: false },
};

export default function MarketplaceEscrowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
