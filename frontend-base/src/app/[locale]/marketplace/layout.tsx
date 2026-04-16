import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Marketplace — EscrowHubs",
    "Create or join trustless escrow transactions on EscrowHubs — no wallet required to get started.",
    "/marketplace",
    locale
  );
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
