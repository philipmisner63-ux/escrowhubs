import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace — EscrowHubs on BlockDAG",
  description: "Buy and sell anything with trustless escrow on BlockDAG. No crypto wallet required to get started.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
