"use client";

/**
 * Client-side wrapper that imports Providers directly.
 * Providers itself isolates browser-only RainbowKit initialization
 * behind a nested dynamic boundary so the rest of the tree (WagmiProvider,
 * QueryClientProvider, ToastProvider, children) remains SSR-renderable.
 */

import { Providers } from "@/components/providers";

export function ProvidersClient({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
