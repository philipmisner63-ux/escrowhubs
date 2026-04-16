import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Global Flow — EscrowHubs",
    "See how EscrowHubs works across multiple chains and regions — a global view of decentralized escrow.",
    "/learn/global-flow",
    locale
  );
}

export default function GlobalFlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
