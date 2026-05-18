"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { ToastProvider, useToast } from "@/components/toast";
import { useWalletTimeout } from "@/lib/hooks/useWalletTimeout";
import { SupportButton } from "@/components/SupportButton";
import { FeedbackButton } from "@/components/feedback-button";
import { DebugPanel } from "@/components/DebugPanel";
import { wagmiConfig } from "@/lib/wagmi";
import dynamic from "next/dynamic";
import "@rainbow-me/rainbowkit/styles.css";

const DynamicRainbowKitProvider = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.RainbowKitProvider),
  { ssr: false }
);

// Must be a child of WagmiProvider + ToastProvider to access their contexts
function WalletTimeoutGuard() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { addToast } = useToast();
  useWalletTimeout({ isConnected, disconnect, addToast });
  return null;
}

function RainbowKitShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@rainbow-me/rainbowkit").then((mod) => {
      if (cancelled) return;
      const t = mod.darkTheme({
        accentColor: "#00f5ff",
        accentColorForeground: "#030303",
        borderRadius: "medium",
        fontStack: "system",
      });
      setTheme(t);
      setMounted(true);
    });
    return () => { cancelled = true; };
  }, []);

  if (!mounted || !theme) {
    return <>{children}</>;
  }

  return (
    <DynamicRainbowKitProvider theme={theme}>
      {children}
    </DynamicRainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        staleTime: 10_000,
      },
    },
  }));

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <WalletTimeoutGuard />
          <SupportButton />
          <FeedbackButton />
          <DebugPanel />
          <RainbowKitShell>
            {children}
          </RainbowKitShell>
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
