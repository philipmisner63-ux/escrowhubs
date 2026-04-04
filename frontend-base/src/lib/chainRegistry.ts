"use client";

/**
 * Chain Registry — Base L2 shim.
 * Canonical chain definitions: @/lib/chains/registry
 * Contract addresses: @/lib/contracts/addresses
 */

export {
  DEFAULT_CHAIN_ID,
  baseMainnet,
  SUPPORTED_CHAINS,
  getChainName,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getRpcUrl,
  isChainSupported,
} from "@/lib/chains/registry";

import {
  DEFAULT_CHAIN_ID,
  baseMainnet,
  getRpcUrl,
} from "@/lib/chains/registry";
import { getContractAddresses } from "@/lib/contracts/addresses";

export interface ChainConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain: any;
  rpcUrl: string;
  explorerUrl: string;
  explorerTxUrl: (hash: string) => string;
  contractAddresses: {
    factory:    `0x${string}`;
    aiArbiter:  `0x${string}`;
    oracle:     `0x${string}`;
  };
  nativeSymbol: string;
}

function buildChainConfig(): Record<number, ChainConfig> {
  const addr = getContractAddresses(DEFAULT_CHAIN_ID);
  return {
    [DEFAULT_CHAIN_ID]: {
      chain:        baseMainnet,
      rpcUrl:       getRpcUrl(DEFAULT_CHAIN_ID),
      explorerUrl:  "https://basescan.org",
      explorerTxUrl: (hash: string) => `https://basescan.org/tx/${hash}`,
      nativeSymbol: "ETH",
      contractAddresses: {
        factory:   addr.factory,
        aiArbiter: addr.arbiter,
        oracle:    addr.trustOracle,
      },
    },
  };
}

export const chainRegistry: Record<number, ChainConfig> = buildChainConfig();

export function getChain(chainId: number): ChainConfig {
  return chainRegistry[chainId] ?? chainRegistry[DEFAULT_CHAIN_ID];
}

export function getDefaultChain(): ChainConfig {
  return chainRegistry[DEFAULT_CHAIN_ID];
}
