"use client";

/**
 * Chain Registry — Base L2 + Celo shim.
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
  celoMainnet,
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
  const baseAddr = getContractAddresses(8453);
  const celoAddr = getContractAddresses(42220);
  return {
    8453: {
      chain:        baseMainnet,
      rpcUrl:       getRpcUrl(8453),
      explorerUrl:  "https://basescan.org",
      explorerTxUrl: (hash: string) => `https://basescan.org/tx/${hash}`,
      nativeSymbol: "ETH",
      contractAddresses: {
        factory:   baseAddr.factory,
        aiArbiter: baseAddr.arbiter,
        oracle:    baseAddr.trustOracle,
      },
    },
    42220: {
      chain:        celoMainnet,
      rpcUrl:       getRpcUrl(42220),
      explorerUrl:  "https://celoscan.io",
      explorerTxUrl: (hash: string) => `https://celoscan.io/tx/${hash}`,
      nativeSymbol: "CELO",
      contractAddresses: {
        factory:   celoAddr.factory,
        aiArbiter: celoAddr.arbiter,
        oracle:    celoAddr.trustOracle,
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
