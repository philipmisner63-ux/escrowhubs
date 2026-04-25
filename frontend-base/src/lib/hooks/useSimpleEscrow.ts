"use client";

import { useReadContracts, useWriteContract, useChainId } from "wagmi";
import { parseEther } from "viem";
import { SIMPLE_ESCROW_ABI } from "@/lib/contracts";
import { GAS_LIMITS } from "@/lib/gasConfig";

type Address = `0x${string}`;

/**
 * Reads core state fields from a simple escrow contract.
 *
 * @param address - Simple escrow contract address to read from.
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useSimpleEscrowRead(address: Address | undefined, chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const contract = { address, abi: SIMPLE_ESCROW_ABI, chainId: resolvedChainId } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "state" },
      { ...contract, functionName: "amount" },
      { ...contract, functionName: "depositor" },
      { ...contract, functionName: "beneficiary" },
      { ...contract, functionName: "arbiter" },
    ],
    query: { enabled: !!address, refetchInterval: 30_000, staleTime: 10_000 },
  });

  return {
    state:       (data?.[0].result as number)  ?? null,
    amount:      (data?.[1].result as bigint)  ?? null,
    depositor:   (data?.[2].result as Address) ?? null,
    beneficiary: (data?.[3].result as Address) ?? null,
    arbiter:     (data?.[4].result as Address) ?? null,
    isLoading,
    refetch,
  };
}

/**
 * Provides write helpers for simple escrow contract actions.
 *
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useSimpleEscrowWrite(chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  return {
    deposit: (address: Address, value: string) =>
      writeContractAsync({
        address,
        abi: SIMPLE_ESCROW_ABI,
        functionName: "deposit",
        value: parseEther(value),
        chainId: resolvedChainId,
      }),
    release: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "release", gas: GAS_LIMITS.release, chainId: resolvedChainId }),
    dispute: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "dispute", gas: GAS_LIMITS.raiseDispute, chainId: resolvedChainId }),
    resolveRelease: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "resolveRelease", gas: GAS_LIMITS.resolveDispute, chainId: resolvedChainId }),
    resolveRefund: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "resolveRefund", gas: GAS_LIMITS.resolveDispute, chainId: resolvedChainId }),
    isPending,
    hash,
    error,
  };
}
