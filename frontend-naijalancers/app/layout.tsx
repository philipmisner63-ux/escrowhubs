import type { Metadata } from "next";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/toast";
import { AnimatedBackground } from "@/components/animated-background";
import { DebugPanel } from "@/components/DebugPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaijaLancers — Marketplace & Safe Escrow Payments",
  description: "Buy and sell goods and services with trust on Celo. Funds locked in cUSD until delivery is confirmed. Powered by EscrowHubs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>
            <AnimatedBackground />
            <DebugPanel />
            <div className="relative min-h-screen flex flex-col">
              {children}
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
