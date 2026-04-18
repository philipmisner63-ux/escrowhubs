// 🚫 DO NOT MODIFY — protected file (see AGENTS.md)
// This layout is intentionally wallet-free.
// RainbowKit/Wagmi/SES → lives in (app)/layout.tsx
// Web3Auth             → lives in marketplace/layout.tsx
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localeMetadata } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { APP_URL, buildMetadata } from "@/lib/metadata";
import "../globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Default (home page) metadata — per-page metadata overrides this
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = await buildMetadata(locale, "home", "");
  return {
    metadataBase: new URL(APP_URL),
    ...base,
    other: {
      'base:app_id': '69d1ab2867a388b6eeaf809f',
      'talentapp:project_verification': 'ec27f475221df086086d3071fe8ad6c0e63c3bcba59dbc1d1df1cad6f4f716939a0c6d125618214434302f71444b71746a3284adcf59eb6a51e4f095efb1e401',
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering — tells next-intl the locale for this request
  setRequestLocale(locale);

  const messages = await getMessages();
  const meta = localeMetadata[locale as Locale];
  const dir = meta?.dir ?? "ltr";

  return (
    <html lang={locale} dir={dir} className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EscrowHubs" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
