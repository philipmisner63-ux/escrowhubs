"use client";

import { useReadContracts, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { SIMPLE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

export function useSimpleEscrowRead(address: Address | undefined) {
  const contract = { address, abi: SIMPLE_ESCROW_ABI } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "state" },
      { ...contract, functionName: "amount" },
      { ...contract, functionName: "depositor" },
      { ...contract, functionName: "beneficiary" },
      { ...contract, functionName: "arbiter" },
    ],
    query: { enabled: !!address },
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

export function useSimpleEscrowWrite() {
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  return {
    deposit: (address: Address, value: string) =>
      writeContractAsync({
        address,
        abi: SIMPLE_ESCROW_ABI,
        functionName: "deposit",
        value: parseEther(value),
      }),
    release: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "release" }),
    dispute: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "dispute" }),
    resolveRelease: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "resolveRelease" }),
    resolveRefund: (address: Address) =>
      writeContractAsync({ address, abi: SIMPLE_ESCROW_ABI, functionName: "resolveRefund" }),
    isPending,
    hash,
    error,
  };
}
