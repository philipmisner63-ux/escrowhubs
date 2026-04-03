"use client";

/**
 * Chain Registry — backward-compat shim.
 *
 * Canonical chain definitions now live in @/lib/chains/registry.
 * Contract addresses now live in @/lib/contracts/addresses.
 * This file re-exports everything + adds the legacy ChainConfig shape
 * used by contracts.ts and older components.
 */

export {
  DEFAULT_CHAIN_ID,
  blockdagMainnet,
  SUPPORTED_CHAINS,
  getChainName,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getRpcUrl,
  isChainSupported,
} from "@/lib/chains/registry";

import {
  DEFAULT_CHAIN_ID,
  blockdagMainnet,
  getRpcUrl,
} from "@/lib/chains/registry";
import { getContractAddresses } from "@/lib/contracts/addresses";

// ─── Legacy ChainConfig shape ─────────────────────────────────────────────────
// Kept for contracts.ts and any code that calls getChain() / getDefaultChain()

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
      chain:        blockdagMainnet,
      rpcUrl:       getRpcUrl(DEFAULT_CHAIN_ID),
      explorerUrl:  "https://bdagscan.com",
      explorerTxUrl: (hash: string) => `https://bdagscan.com/tx/${hash}`,
      nativeSymbol: "BDAG",
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
