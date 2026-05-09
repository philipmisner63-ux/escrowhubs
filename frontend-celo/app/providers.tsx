"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter } from "@/lib/config";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TranslationProvider } from "@/lib/useTranslation";
import { useMiniPay } from "@/hooks/useMiniPay";
import { detectContext, type AppContext } from "@/lib/context";

// AppKit (WalletConnect) — only loads for non-MiniPay contexts
const AppKitInit = dynamic(() => import("@/lib/appkit-init"), { ssr: false });

// Auto-connects when running inside MiniPay (Celo wallet, 10M+ users)
function MiniPayAutoConnect() {
  useMiniPay();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [appContext, setAppContext] = useState<AppContext | null>(null);

  useEffect(() => {
    detectContext().then(setAppContext);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          {appContext === "minipay" ? (
            <MiniPayAutoConnect />
          ) : appContext !== null ? (
            <AppKitInit />
          ) : null}
          {children}
        </TranslationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
