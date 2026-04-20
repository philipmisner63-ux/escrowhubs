import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Onboarding — EscrowHubs",
    "Step-by-step guide to connecting your wallet and switching to Base network on EscrowHubs.",
    "/learn/onboarding",
    locale
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
