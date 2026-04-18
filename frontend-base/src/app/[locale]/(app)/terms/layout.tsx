import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Terms of Service — EscrowHubs",
    "Read the EscrowHubs Terms of Service — conditions for using our decentralized escrow platform on Base.",
    "/terms",
    locale
  );
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
