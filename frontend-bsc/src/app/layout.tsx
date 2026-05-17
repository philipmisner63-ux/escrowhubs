// Root layout — minimal shell. Locale-aware layout is in [locale]/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#06b6d4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EscrowHubs",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "google-site-verification": "fkTNXR1rE9muAcdAYD4qGMNADb7XmxvrcJOdwxEPfsg",
    "msvalidate.01": "2CC2E70C01953340CA4DD7EFF81F7C10",
    "yandex-verification": "34782cfba2a14ee4",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
