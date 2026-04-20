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
    "Role View — EscrowHubs",
    "Explore the escrow experience from the depositor and beneficiary perspectives on EscrowHubs.",
    "/learn/role-view",
    locale
  );
}

export default function RoleViewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
