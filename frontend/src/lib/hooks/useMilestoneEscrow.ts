"use client";

import { useReadContracts, useWriteContract } from "wagmi";
import { MILESTONE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

export interface MilestoneData {
  description: string;
  amount: bigint;
  state: number;
}

export function useMilestoneEscrowRead(address: Address | undefined) {
  const contract = { address, abi: MILESTONE_ESCROW_ABI } as const;

  // Base reads
  const { data: baseData, isLoading: baseLoading, refetch: refetchBase } = useReadContracts({
    contracts: [
      { ...contract, functionName: "depositor" },
      { ...contract, functionName: "beneficiary" },
      { ...contract, functionName: "arbiter" },
      { ...contract, functionName: "totalDeposited" },
      { ...contract, functionName: "funded" },
      { ...contract, functionName: "milestoneCount" },
    ],
    query: { enabled: !!address },
  });

  const milestoneCount = (baseData?.[5].result as bigint | undefined) ?? 0n;
  const indices = Array.from({ length: Number(milestoneCount) }, (_, i) => BigInt(i));

  // Per-milestone reads
  const { data: milestoneData, isLoading: msLoading, refetch: refetchMs } = useReadContracts({
    contracts: indices.map(i => ({
      ...contract,
      functionName: "milestones" as const,
      args: [i] as const,
    })),
    query: { enabled: !!address && milestoneCount > 0n },
  });

  const milestones: MilestoneData[] = (milestoneData ?? []).map(d => {
    const r = d.result as [string, bigint, number] | undefined;
    return r
      ? { description: r[0], amount: r[1], state: r[2] }
      : { description: "", amount: 0n, state: 0 };
  });

  return {
    depositor:      (baseData?.[0].result as Address) ?? null,
    beneficiary:    (baseData?.[1].result as Address) ?? null,
    arbiter:        (baseData?.[2].result as Address) ?? null,
    totalDeposited: (baseData?.[3].result as bigint)  ?? null,
    funded:         (baseData?.[4].result as boolean) ?? null,
    milestoneCount: Number(milestoneCount),
    milestones,
    isLoading: baseLoading || msLoading,
    refetch: () => { refetchBase(); refetchMs(); },
  };
}

export function useMilestoneEscrowWrite() {
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  return {
    fund: (address: Address, value: bigint) =>
      writeContractAsync({
        address,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "fund",
        value,
      }),
    releaseMilestone: (address: Address, index: bigint) =>
      writeContractAsync({ address, abi: MILESTONE_ESCROW_ABI, functionName: "releaseMilestone", args: [index] }),
    disputeMilestone: (address: Address, index: bigint) =>
      writeContractAsync({ address, abi: MILESTONE_ESCROW_ABI, functionName: "disputeMilestone", args: [index] }),
    resolveRelease: (address: Address, index: bigint) =>
      writeContractAsync({ address, abi: MILESTONE_ESCROW_ABI, functionName: "resolveRelease", args: [index] }),
    resolveRefund: (address: Address, index: bigint) =>
      writeContractAsync({ address, abi: MILESTONE_ESCROW_ABI, functionName: "resolveRefund", args: [index] }),
    isPending,
    hash,
    error,
  };
}
