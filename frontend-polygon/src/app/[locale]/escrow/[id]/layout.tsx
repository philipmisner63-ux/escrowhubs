import type { Metadata } from "next";
import { APP_URL } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const short = id.length >= 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
  const title = `Escrow ${short} — EscrowHubs`;
  const description = `View and interact with escrow contract ${short} on Polygon via EscrowHubs.`;
  const url = `${APP_URL}/${locale}/escrow/${id}`;

  return {
    title,
    description,
    robots: { index: false, follow: false }, // escrows are private, don't index
    openGraph: {
      title,
      description,
      url,
      siteName: "EscrowHubs",
      type: "website",
    },
  };
}

export default function EscrowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
