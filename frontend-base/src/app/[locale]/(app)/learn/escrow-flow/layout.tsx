import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Escrow Flow — EscrowHubs",
    "Detailed step-by-step breakdown of the escrow lifecycle — creation, funding, release, and dispute.",
    "/learn/escrow-flow",
    locale
  );
}

export default function EscrowFlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
