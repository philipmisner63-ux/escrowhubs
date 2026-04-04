"use client";

/**
 * Client-side wrapper that dynamically imports Providers with ssr:false.
 * This prevents wagmi / WalletConnect / idb-keyval from being evaluated
 * during SSR/SSG, eliminating the "indexedDB is not defined" build warning.
 */

import dynamic from "next/dynamic";

const ProvidersInner = dynamic(
  () => import("@/components/providers").then(m => m.Providers),
  { ssr: false }
);

export function ProvidersClient({ children }: { children: React.ReactNode }) {
  return <ProvidersInner>{children}</ProvidersInner>;
}
