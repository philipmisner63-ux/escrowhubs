import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Network Simulator — EscrowHubs",
    "Simulate blockchain network conditions and see how EscrowHubs handles congestion, fees, and confirmations.",
    "/learn/network-sim",
    locale
  );
}

export default function NetworkSimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
