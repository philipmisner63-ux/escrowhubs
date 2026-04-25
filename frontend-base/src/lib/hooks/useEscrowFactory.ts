"use client";

import { useReadContracts, useWriteContract, useWatchContractEvent, useChainId } from "wagmi";
import { useState, useCallback } from "react";
import { parseEther } from "viem";
import { ESCROW_FACTORY_ABI } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";
import { computeTrustScore } from "@/lib/trustScore";

type Address = `0x${string}`;

export interface FactoryEscrowRecord {
  contractAddress: Address;
  escrowType: number;      // 0 = Simple, 1 = Milestone
  depositor: Address;
  beneficiary: Address;
  arbiter: Address;
  totalAmount: bigint;
  trustTier: number;
  createdAt: bigint;
}

/**
 * Reads factory deployment status and aggregate escrow count for a chain.
 *
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useEscrowFactory(chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const factoryAddress = getFactoryAddress(resolvedChainId);
  const contract = { address: factoryAddress, abi: ESCROW_FACTORY_ABI, chainId: resolvedChainId } as const;
  const enabled = factoryAddress.length > 2;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "escrowCount" },
    ],
    query: { enabled, refetchInterval: 30_000 },
  });

  return {
    escrowCount: (data?.[0].result as bigint | undefined) ?? 0n,
    isLoading,
    refetch,
    factoryDeployed: enabled,
  };
}

/**
 * Reads a paginated list of escrow records from the factory contract.
 *
 * @param offset - Starting index for the escrow records page.
 * @param limit - Maximum number of escrow records to read.
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useFactoryEscrows(offset: bigint = 0n, limit: bigint = 20n, chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const factoryAddress = getFactoryAddress(resolvedChainId);
  const enabled = factoryAddress.length > 2;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: factoryAddress,
        abi: ESCROW_FACTORY_ABI,
        functionName: "getEscrows",
        args: [offset, limit],
        chainId: resolvedChainId,
      },
    ],
    query: { enabled, refetchInterval: 30_000 },
  });

  const records = (data?.[0].result as FactoryEscrowRecord[] | undefined) ?? [];

  return { records, isLoading, refetch };
}

/**
 * Reads escrow IDs associated with a wallet as depositor and beneficiary.
 *
 * @param walletAddress - Wallet address whose escrow IDs should be queried.
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useWalletEscrows(walletAddress: Address | undefined, chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const factoryAddress = getFactoryAddress(resolvedChainId);
  const enabled = factoryAddress.length > 2 && !!walletAddress;
  const contract = { address: factoryAddress, abi: ESCROW_FACTORY_ABI, chainId: resolvedChainId } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "getEscrowsByDepositor",   args: [walletAddress!] },
      { ...contract, functionName: "getEscrowsByBeneficiary", args: [walletAddress!] },
    ],
    query: { enabled, refetchInterval: 30_000 },
  });

  return {
    asDepositor:    (data?.[0].result as bigint[] | undefined) ?? [],
    asBeneficiary:  (data?.[1].result as bigint[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

/**
 * Provides factory write helpers for deploying simple and milestone escrow contracts.
 *
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useFactoryDeploy(chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  const deploySimple = async (
    beneficiary: Address,
    arbiter: Address,
    amountEth: string,
    walletAddress?: Address,
    useAIArbiter = false,
  ) => {
    const factoryAddress = getFactoryAddress(resolvedChainId);
    const trust = computeTrustScore({
      walletAddress,
      amountEth: parseFloat(amountEth),
      isConnected: true,
    });

    return writeContractAsync({
      address: factoryAddress,
      abi: ESCROW_FACTORY_ABI,
      functionName: "createSimpleEscrow",
      args: [beneficiary, arbiter, trust.tier, useAIArbiter],
      value: parseEther(amountEth),
      chainId: resolvedChainId,
    });
  };

  const deployMilestone = async (
    beneficiary: Address,
    arbiter: Address,
    descriptions: string[],
    amounts: bigint[],
    walletAddress?: Address,
    useAIArbiter = false,
  ) => {
    const factoryAddress = getFactoryAddress(resolvedChainId);
    const totalEth = parseFloat(
      (amounts.reduce((a, b) => a + b, 0n) / BigInt(1e18)).toString()
    );
    const trust = computeTrustScore({
      walletAddress,
      amountEth: totalEth,
      isConnected: true,
    });
    const total = amounts.reduce((a, b) => a + b, 0n);

    return writeContractAsync({
      address: factoryAddress,
      abi: ESCROW_FACTORY_ABI,
      functionName: "createMilestoneEscrow",
      args: [beneficiary, arbiter, descriptions, amounts, trust.tier, useAIArbiter],
      value: total,
      chainId: resolvedChainId,
    });
  };

  return { deploySimple, deployMilestone, isPending, hash, error };
}

/**
 * Watches factory creation events and keeps the most recent events in memory.
 *
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useFactoryEvents(chainId?: number) {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const factoryAddress = getFactoryAddress(resolvedChainId);
  const [events, setEvents] = useState<Array<{ name: string; args: Record<string, unknown>; timestamp: number }>>([]);
  const enabled = factoryAddress.length > 2;

  const add = useCallback((name: string, args: Record<string, unknown>) => {
    setEvents(prev => [{ name, args, timestamp: Date.now() }, ...prev].slice(0, 50));
  }, []);

  useWatchContractEvent({
    address: factoryAddress,
    abi: ESCROW_FACTORY_ABI,
    eventName: "SimpleEscrowCreated",
    chainId: resolvedChainId,
    onLogs: logs => logs.forEach(l => add("SimpleEscrowCreated", (l as unknown as { args: Record<string, unknown> }).args ?? {})),
    enabled,
  });

  useWatchContractEvent({
    address: factoryAddress,
    abi: ESCROW_FACTORY_ABI,
    eventName: "MilestoneEscrowCreated",
    chainId: resolvedChainId,
    onLogs: logs => logs.forEach(l => add("MilestoneEscrowCreated", (l as unknown as { args: Record<string, unknown> }).args ?? {})),
    enabled,
  });

  return { events };
}
