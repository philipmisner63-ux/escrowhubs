"use client";

/**
 * Chain Registry — single source of truth for all chain-specific config.
 * Add new chains here; no other files need to change for multi-chain support.
 */

export const DEFAULT_CHAIN_ID = 1404;

export interface ChainConfig {
  chain: {
    id: number;
    name: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: { default: { http: string[] } };
    blockExplorers: { default: { name: string; url: string } };
    testnet: boolean;
  };
  rpcUrl: string;
  explorerUrl: string;
  explorerTxUrl: (hash: string) => string;
  contractAddresses: {
    factory: `0x${string}`;
    aiArbiter: `0x${string}`;
    oracle: `0x${string}`;
  };
  nativeSymbol: string;
}

const blockdagRpc =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BLOCKDAG_RPC) ||
  "https://rpc.bdagscan.com";

export const chainRegistry: Record<number, ChainConfig> = {
  1404: {
    chain: {
      id: 1404,
      name: "BlockDAG",
      nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
      rpcUrls: { default: { http: [blockdagRpc] } },
      blockExplorers: { default: { name: "BDAGScan", url: "https://bdagscan.com" } },
      testnet: false,
    },
    rpcUrl: blockdagRpc,
    explorerUrl: "https://bdagscan.com",
    explorerTxUrl: (hash: string) => `https://bdagscan.com/tx/${hash}`,
    nativeSymbol: "BDAG",
    contractAddresses: {
      factory:   (process.env.NEXT_PUBLIC_FACTORY_ADDRESS    ?? "0x8a9001c28c4cc1e0952ae5ca2a8366f1c1ac6724") as `0x${string}`,
      aiArbiter: (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS ?? "0x8ee119999d87dcf9e9bf80a876c18f9c85d8b4c1") as `0x${string}`,
      oracle:    (process.env.NEXT_PUBLIC_ORACLE_ADDRESS     ?? "0x5ee4939ff22501ba53428e23004fa7b6f271a7d0") as `0x${string}`,
    },
  },
};

export function getChain(chainId: number): ChainConfig {
  return chainRegistry[chainId] ?? chainRegistry[DEFAULT_CHAIN_ID];
}

export function getDefaultChain(): ChainConfig {
  return chainRegistry[DEFAULT_CHAIN_ID];
}
