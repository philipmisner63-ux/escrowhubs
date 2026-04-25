import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";

export const APP_URL = "https://base.escrowhubs.io";
export const SITE_NAME = "EscrowHubs";

// Map next-intl locale → OG locale format
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

// hreflang alternates for all locales
export function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc === "pt-BR" ? "pt-BR" : loc] = `${APP_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${APP_URL}/en${path}`;
  return { languages, canonical: undefined }; // canonical set per-page
}

export async function buildMetadata(
  locale: string,
  namespace: "home" | "dashboard" | "create" | "howItWorks",
  path: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t(`${namespace}.title`);
  const description = t(`${namespace}.description`);
  const url = `${APP_URL}/${locale}${path}`;
  const ogLocale = OG_LOCALE_MAP[locale] ?? "en_US";
  const alternates = buildAlternates(path);

  return {
    title: title as string,
    description: description as string,
    alternates: {
      ...alternates,
      canonical: url,
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
      googleBot: {
        index: true,
        follow: true,
      },
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

/**
 * Lightweight metadata builder for pages without a translation namespace.
 * Use for learn/* pages and other static-title pages.
 */
export function buildPageMetadata(
  title: string,
  description: string,
  path: string,
  locale: string
): Metadata {
  const url = `${APP_URL}/${locale}${path}`;
  const ogLocale = OG_LOCALE_MAP[locale] ?? "en_US";
  const alternates = buildAlternates(path);

  return {
    title,
    description,
    alternates: {
      ...alternates,
      canonical: url,
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
          alt: `${SITE_NAME} — Trustless Multi-Chain Escrow`,
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
