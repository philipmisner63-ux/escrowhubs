"use client";

import { useReadContract, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { MILESTONE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

/**
 * Detects whether an escrow contract address behaves like a simple or milestone escrow.
 *
 * @param address - Escrow contract address to inspect.
 * @param chainId - Optional chain ID to use instead of the connected wallet chain.
 */
export function useContractType(address: Address | undefined, chainId?: number): "simple" | "milestone" | "unknown" {
  const activeChainId = useChainId();
  const resolvedChainId = chainId ?? activeChainId;
  const [timedOut, setTimedOut] = useState(false);

  const { data, isLoading, isError } = useReadContract({
    address,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "milestoneCount",
    chainId: resolvedChainId,
    query: { enabled: !!address, retry: 1 },
  });

  // Fallback: if still loading after 8s, assume simple escrow
  useEffect(() => {
    if (!address) return;
    setTimedOut(false);
    const t = setTimeout(() => setTimedOut(true), 8_000);
    return () => clearTimeout(t);
  }, [address, resolvedChainId]);

  if (!address || isLoading) return "unknown";
  if (isError) return "unknown";
  if (data !== undefined) return "milestone";
  return "unknown";
}
