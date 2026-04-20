"use client";

import dynamic from "next/dynamic";

// Dynamically imported with ssr:false — ChainGuard uses wagmi hooks
// which must not execute before WagmiProvider mounts (fixes SES_UNCAUGHT_EXCEPTION)
const ChainGuard = dynamic(
  () => import("@/components/chain-guard").then(m => m.ChainGuard),
  { ssr: false }
);

export function ChainGuardClient({ children }: { children: React.ReactNode }) {
  return <ChainGuard>{children}</ChainGuard>;
}
