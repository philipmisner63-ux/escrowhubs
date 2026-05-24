import type { Metadata } from "next";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/toast";
import { AnimatedBackground } from "@/components/animated-background";
import { DebugPanel } from "@/components/DebugPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaijaLancers — Safe Payments for Freelancers",
  description: "Get paid with confidence. Your money is held securely until the job is done. Built for Nigerian freelancers and clients.",
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
