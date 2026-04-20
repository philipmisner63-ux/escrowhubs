import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "How It Works — EscrowHubs",
    "Animated walkthroughs of Simple, Milestone, and AI Arbiter escrow flows on Base.",
    "/learn/how-it-works",
    locale
  );
}

export default function HowItWorksLearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
