/**
 * Chain Registry — BNB Smart Chain deployment.
 * Single source of truth for chain configuration.
 */

import { defineChain, type Chain } from "viem";

const bscRpc =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BSC_RPC_URL) ||
  "https://bsc-dataseed.binance.org";

export const bscMainnet = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: {
    default: { http: [bscRpc] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
});

// Aliases so existing imports don't break
export const polygonMainnet = bscMainnet;
export const baseMainnet = bscMainnet;

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  bscMainnet,
] as const;

export const DEFAULT_CHAIN_ID = 56;

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
