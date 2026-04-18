import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Mock Escrow — EscrowHubs",
    "Try an interactive mock escrow without spending real funds — practice the full flow on EscrowHubs.",
    "/learn/mock-escrow",
    locale
  );
}

export default function MockEscrowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
