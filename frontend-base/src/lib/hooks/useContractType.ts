"use client";

import { useReadContract, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { MILESTONE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

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

  if (!address) return "unknown";
  if (isError) return "simple";
  if (data !== undefined) return "milestone";
  if (timedOut) return "simple"; // fallback after 8s
  if (isLoading) return "unknown";
  return "unknown";
}
