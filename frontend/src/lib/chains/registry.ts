/**
 * Chain Registry — single authoritative source for all chain configuration.
 *
 * ALL chain IDs, RPC URLs, explorer URLs, and chain objects must originate here.
 * No other file should define inline chain objects or hardcode these values.
 *
 * To add a new chain: add an entry to SUPPORTED_CHAINS.
 * Everything else (wagmi, hooks, pages) picks it up automatically.
 */

import { defineChain, type Chain } from "viem";

// ─── Chain definitions ────────────────────────────────────────────────────────

const blockdagRpc =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BLOCKDAG_RPC) ||
  "https://rpc.blockdag.engineering";

export const blockdagMainnet = defineChain({
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: {
    default: { http: [blockdagRpc] },
  },
  blockExplorers: {
    default: { name: "BDAGScan", url: "https://bdagscan.com" },
  },
});

// ─── Supported chains (used by wagmi config) ─────────────────────────────────

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  blockdagMainnet,
] as const;

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_CHAIN_ID = 1404;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  return chain?.name ?? `Unknown (${chainId})`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  return baseUrl ? `${baseUrl}/tx/${txHash}` : "#";
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  return baseUrl ? `${baseUrl}/address/${address}` : "#";
}

export function getRpcUrl(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  return chain?.rpcUrls?.default?.http?.[0] ?? "";
}

export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some(c => c.id === chainId);
}
