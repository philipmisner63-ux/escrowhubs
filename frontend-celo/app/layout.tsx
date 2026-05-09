import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ClientContext } from "./client-context";
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
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Providers>
          <ClientContext>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <FeedbackButton />
          </ClientContext>
        </Providers>
        <footer className="mt-auto py-4 text-center text-xs text-gray-500">
          © 2026 EscrowHubs LLC ·{" "}
          <a href="/terms" className="underline hover:text-gray-700">Terms</a>
          {" · "}
          <a href="/privacy" className="underline hover:text-gray-700">Privacy</a>
          {" · "}
          <a href="https://discord.gg/escrowhubs" className="underline hover:text-gray-700">Support</a>
        </footer>
      </body>
    </html>
  );
}
