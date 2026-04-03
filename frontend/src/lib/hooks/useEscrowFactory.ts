"use client";

import { useReadContracts, useWriteContract, useWatchContractEvent, useChainId } from "wagmi";
import { useState, useCallback } from "react";
import { parseEther } from "viem";
import { ESCROW_FACTORY_ABI } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";
import { DEFAULT_CHAIN_ID } from "@/lib/chains";
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

export function useEscrowFactory() {
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const contract = { address: factoryAddress, abi: ESCROW_FACTORY_ABI } as const;
  const enabled = factoryAddress.length > 2;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "escrowCount" },
    ],
    query: { enabled, refetchInterval: 5_000 },
  });

  return {
    escrowCount: (data?.[0].result as bigint | undefined) ?? 0n,
    isLoading,
    refetch,
    factoryDeployed: enabled,
  };
}

export function useFactoryEscrows(offset: bigint = 0n, limit: bigint = 20n) {
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const enabled = factoryAddress.length > 2;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: factoryAddress,
        abi: ESCROW_FACTORY_ABI,
        functionName: "getEscrows",
        args: [offset, limit],
      },
    ],
    query: { enabled, refetchInterval: 5_000 },
  });

  const records = (data?.[0].result as FactoryEscrowRecord[] | undefined) ?? [];

  return { records, isLoading, refetch };
}

export function useWalletEscrows(walletAddress: Address | undefined) {
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const enabled = factoryAddress.length > 2 && !!walletAddress;
  const contract = { address: factoryAddress, abi: ESCROW_FACTORY_ABI } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "getEscrowsByDepositor",   args: [walletAddress!] },
      { ...contract, functionName: "getEscrowsByBeneficiary", args: [walletAddress!] },
    ],
    query: { enabled, refetchInterval: 5_000 },
  });

  return {
    asDepositor:    (data?.[0].result as bigint[] | undefined) ?? [],
    asBeneficiary:  (data?.[1].result as bigint[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

export function useFactoryDeploy() {
  const chainId = useChainId();
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  const deploySimple = async (
    beneficiary: Address,
    arbiter: Address,
    amountEth: string,
    walletAddress?: Address,
    useAIArbiter = false,
  ) => {
    const factoryAddress = getFactoryAddress(chainId);
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
    const factoryAddress = getFactoryAddress(chainId);
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
    });
  };

  return { deploySimple, deployMilestone, isPending, hash, error };
}

export function useFactoryEvents() {
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const [events, setEvents] = useState<Array<{ name: string; args: Record<string, unknown>; timestamp: number }>>([]);
  const enabled = factoryAddress.length > 2;

  const add = useCallback((name: string, args: Record<string, unknown>) => {
    setEvents(prev => [{ name, args, timestamp: Date.now() }, ...prev].slice(0, 50));
  }, []);

  useWatchContractEvent({
    address: factoryAddress,
    abi: ESCROW_FACTORY_ABI,
    eventName: "SimpleEscrowCreated",
    onLogs: logs => logs.forEach(l => add("SimpleEscrowCreated", (l as unknown as { args: Record<string, unknown> }).args ?? {})),
    enabled,
  });

  useWatchContractEvent({
    address: factoryAddress,
    abi: ESCROW_FACTORY_ABI,
    eventName: "MilestoneEscrowCreated",
    onLogs: logs => logs.forEach(l => add("MilestoneEscrowCreated", (l as unknown as { args: Record<string, unknown> }).args ?? {})),
    enabled,
  });

  return { events };
}
