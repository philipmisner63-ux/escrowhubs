/**
 * (app) route group layout
 * ─────────────────────────────────────────────────────────────────────────────
 * All crypto-native routes live here: dashboard, create, escrow, landing, etc.
 *
 * RainbowKit, Wagmi, WalletConnect, and SES are ONLY loaded inside this subtree.
 * The marketplace subtree (../marketplace/) never imports this layout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ProvidersClient } from "@/components/providers-client";
import { PWARegister } from "@/components/pwa-register";
import { AnimatedBackground } from "@/components/animated-background";
import dynamic from "next/dynamic";

// Dynamically imported — uses wagmi hooks, must not run before WagmiProvider mounts
const ChainGuard = dynamic(
  () => import("@/components/chain-guard").then(m => m.ChainGuard),
  { ssr: false }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersClient>
      <PWARegister />
      <AnimatedBackground />
      <div className="relative min-h-screen">
        <ChainGuard>
          {children}
        </ChainGuard>
      </div>
    </ProvidersClient>
  );
}
