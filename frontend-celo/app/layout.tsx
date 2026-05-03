import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeedbackButton } from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "EscrowHubs — Pay When Done",
  description: "Send money safely. It's held until the job is complete.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EscrowHubs",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  );
}
