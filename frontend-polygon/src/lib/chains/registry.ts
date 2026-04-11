/**
 * Chain Registry — Polygon PoS deployment.
 * Single source of truth for chain configuration.
 */

import { defineChain, type Chain } from "viem";

const polygonRpc =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_POLYGON_RPC_URL) ||
  "https://polygon-mainnet.g.alchemy.com/v2/YUs_6FzIKG617Yt8pMqay";

export const polygonMainnet = defineChain({
  id: 137,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: {
    default: { http: [polygonRpc] },
  },
  blockExplorers: {
    default: { name: "Polygonscan", url: "https://polygonscan.com" },
  },
});

// Re-export as baseMainnet alias so existing imports don't break
export const baseMainnet = polygonMainnet;

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  polygonMainnet,
] as const;

export const DEFAULT_CHAIN_ID = 137;

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
