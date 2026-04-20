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
    "FAQ — EscrowHubs",
    "Frequently asked questions about EscrowHubs — how escrow works, fees, disputes, and more.",
    "/learn/faq",
    locale
  );
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
