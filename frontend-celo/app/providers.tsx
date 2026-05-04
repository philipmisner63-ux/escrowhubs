"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/config";
import { useState } from "react";
import { TranslationProvider } from "@/lib/useTranslation";
import { useMiniPay } from "@/hooks/useMiniPay";
import "@rainbow-me/rainbowkit/styles.css";

// Auto-connects when running inside MiniPay (Celo wallet, 10M+ users)
function MiniPayAutoConnect() {
  useMiniPay();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#35D07F",
            accentColorForeground: "#000000",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          <TranslationProvider>
            <MiniPayAutoConnect />
            {children}
          </TranslationProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
