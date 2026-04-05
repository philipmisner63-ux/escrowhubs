import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ProvidersClient } from "@/components/providers-client";
import { AnimatedBackground } from "@/components/animated-background";
import { routing } from "@/i18n/routing";
import { localeMetadata } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { APP_URL, SITE_NAME, buildMetadata } from "@/lib/metadata";
import { PWARegister } from "@/components/pwa-register";
import { ChainGuard } from "@/components/chain-guard";
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
          <ProvidersClient>
            <PWARegister />
            <AnimatedBackground />
            <div className="relative min-h-screen">
              <ChainGuard>
                {children}
              </ChainGuard>
            </div>
          </ProvidersClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
