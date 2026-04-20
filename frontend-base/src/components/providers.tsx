"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ToastProvider, useToast } from "@/components/toast";
import { useWalletTimeout } from "@/lib/hooks/useWalletTimeout";
import { SupportButton } from "@/components/SupportButton";
import { useMiniPay } from "@/lib/hooks/useMiniPay";
import { FeedbackButton } from "@/components/feedback-button";
import "@rainbow-me/rainbowkit/styles.css";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 10_000,
    },
  },
});

// Auto-connects when running inside MiniPay (Celo wallet, 10M+ users)
function MiniPayAutoConnect() {
  useMiniPay();
  return null;
}

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
        <OnchainKitProvider chain={base} apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY ?? ""}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00f5ff",
            accentColorForeground: "#030303",
            borderRadius: "medium",
            fontStack: "system",
            // overlayBlur removed — causes black screen on mobile WebViews (see AGENTS.md)
          })}
        >
          <ToastProvider>
            <WalletTimeoutGuard />
            <MiniPayAutoConnect />
            <SupportButton />
            <FeedbackButton />
            {children}
          </ToastProvider>
        </RainbowKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
