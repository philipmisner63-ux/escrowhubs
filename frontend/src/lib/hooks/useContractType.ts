"use client";

import { useReadContract, useChainId } from "wagmi";
import { MILESTONE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

export function useContractType(address: Address | undefined, chainId?: number): "simple" | "milestone" | "unknown" {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;

  const { data, isLoading, isError } = useReadContract({
    address,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "milestoneCount",
    chainId: resolvedChainId,
    query: { enabled: !!address, retry: false },
  });

  if (!address || isLoading) return "unknown";
  if (isError) return "simple";
  if (data !== undefined) return "milestone";
  return "unknown";
}
