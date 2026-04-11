"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ToastProvider, useToast } from "@/components/toast";
import { useWalletTimeout } from "@/lib/hooks/useWalletTimeout";
import { SupportButton } from "@/components/SupportButton";
import { FeedbackButton } from "@/components/feedback-button";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 10_000,
    },
  },
});

// Must be a child of WagmiProvider + ToastProvider to access their contexts
function WalletTimeoutGuard() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { addToast } = useToast();
  useWalletTimeout({ isConnected, disconnect, addToast });
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00f5ff",
            accentColorForeground: "#030303",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <ToastProvider>
            <WalletTimeoutGuard />
            <SupportButton />
            <FeedbackButton />
            {children}
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
