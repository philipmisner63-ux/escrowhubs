import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { AnimatedBackground } from "@/components/animated-background";
import { routing } from "@/i18n/routing";
import { localeMetadata } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import "../globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const APP_URL = "https://app.escrowhubs.io";
const TITLE = "BlockDAG Escrow | Trustless Smart Contract Payments";
const DESCRIPTION = "Create and manage trustless escrow contracts on BlockDAG. Milestone-based payments, AI dispute resolution, and full WalletConnect support.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "BlockDAG Escrow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

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

  const messages = await getMessages();
  const meta = localeMetadata[locale as Locale];
  const dir = meta?.dir ?? "ltr";

  return (
    <html lang={locale} dir={dir} className="dark">
      <body className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AnimatedBackground />
            <div className="relative min-h-screen">
              {children}
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
