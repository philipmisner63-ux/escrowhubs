import type { Metadata } from "next";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/toast";
import { AnimatedBackground } from "@/components/animated-background";
import { DebugPanel } from "@/components/DebugPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "EscrowHubs — Protect Any Deal in Nigeria",
  description: "Buy or sell anything safely. Your money is held securely until delivery is confirmed. Built for Nigerians trading online.",
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
