/**
 * Chain Registry — Base L2 deployment.
 * Single source of truth for chain configuration.
 */

import { defineChain, type Chain } from "viem";

const baseRpc =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_RPC_URL) ||
  "https://mainnet.base.org";

export const baseMainnet = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [baseRpc] },
  },
  blockExplorers: {
    default: { name: "Basescan", url: "https://basescan.org" },
  },
});

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  baseMainnet,
] as const;

export const DEFAULT_CHAIN_ID = 8453;

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
