import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Privacy Policy — EscrowHubs",
    "Read the EscrowHubs Privacy Policy — how we handle data on our decentralized escrow platform.",
    "/privacy",
    locale
  );
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
