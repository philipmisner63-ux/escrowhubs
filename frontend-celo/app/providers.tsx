"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/config";
import { useState } from "react";
import { TranslationProvider } from "@/lib/useTranslation";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
