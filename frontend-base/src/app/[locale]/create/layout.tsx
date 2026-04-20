import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata(locale, "create", "/create");
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
