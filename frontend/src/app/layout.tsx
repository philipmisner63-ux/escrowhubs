import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnimatedBackground } from "@/components/animated-background";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <AnimatedBackground />
          <div className="relative min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
