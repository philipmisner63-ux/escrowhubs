"use client";

import { useChainId } from "wagmi";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { getChainName, getExplorerTxUrl, getRpcUrl, isChainSupported } from "@/lib/chains";
import { GAS_LIMITS } from "@/lib/gasConfig";

/**
 * Returns chain-specific app configuration for the active wallet chain or an explicit override.
 *
 * @param overrideChainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useChainConfig(overrideChainId?: number) {
  const activeChainId = useChainId();
  const chainId = overrideChainId ?? activeChainId;

  return {
    chainId,
    chainName:          getChainName(chainId),
    contracts:          getContractAddresses(chainId),
    rpcUrl:             getRpcUrl(chainId),
    getExplorerTxUrl:   (txHash: string) => getExplorerTxUrl(chainId, txHash),
    gasLimits:          GAS_LIMITS,
    isSupported:        isChainSupported(chainId),
  };
}
