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

export const metadata: Metadata = {
  title: "BlockDAG Escrow",
  description: "Trustless escrow on BlockDAG — milestone-based smart contract payments",
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
