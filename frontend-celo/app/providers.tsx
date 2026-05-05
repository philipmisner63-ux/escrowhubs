"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter } from "@/lib/config";
import "@/lib/appkit";
import { useState } from "react";
import { TranslationProvider } from "@/lib/useTranslation";
import { useMiniPay } from "@/hooks/useMiniPay";

// Auto-connects when running inside MiniPay (Celo wallet, 10M+ users)
function MiniPayAutoConnect() {
  useMiniPay();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          <MiniPayAutoConnect />
          {children}
        </TranslationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
