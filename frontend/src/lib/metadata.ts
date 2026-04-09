import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";

export const APP_URL = "https://app.escrowhubs.io";
export const SITE_NAME = "EscrowHubs";

export const OG_LOCALE_MAP: Record<string, string> = {
  en:      "en_US",
  ar:      "ar_SA",
  es:      "es_ES",
  zh:      "zh_CN",
  ru:      "ru_RU",
  "pt-BR": "pt_BR",
  tr:      "tr_TR",
  hi:      "hi_IN",
  fr:      "fr_FR",
  de:      "de_DE",
  ko:      "ko_KR",
  ja:      "ja_JP",
};

export function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc === "pt-BR" ? "pt-BR" : loc] = `${APP_URL}/${loc}${path}`;
  }
  // x-default points to root which 301s to /en
  languages["x-default"] = `${APP_URL}/en${path}`;
  return { languages };
}

export async function buildMetadata(
  locale: string,
  namespace: "home" | "dashboard" | "create" | "howItWorks",
  path: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t(`${namespace}.title`);
  const description = t(`${namespace}.description`);
  const canonical = `${APP_URL}/${locale}${path}`;
  const url = canonical;
  const ogLocale = OG_LOCALE_MAP[locale] ?? "en_US";
  const alternates = buildAlternates(path);

  return {
    title,
    description,
    alternates: {
      ...alternates,
      canonical,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: ogLocale,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Secure On-Chain Escrow`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}
