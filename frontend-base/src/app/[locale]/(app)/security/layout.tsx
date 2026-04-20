import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { APP_URL, SITE_NAME, buildAlternates } from "@/lib/metadata";
import { OG_LOCALE_MAP } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "security" });
  const title = t("metaTitle");
  const description = t("metaDesc");
  const url = `${APP_URL}/${locale}/security`;
  const alternates = buildAlternates("/security");

  return {
    title,
    description,
    alternates: { ...alternates, canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE_MAP[locale] ?? "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
