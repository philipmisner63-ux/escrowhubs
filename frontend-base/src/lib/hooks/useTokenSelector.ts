"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ERC20ABI } from "@/lib/contracts";
import { getFactoryAddress } from "@/lib/contracts/addresses";

// Base USDC
const USDC_BASE = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`;
// Celo cUSD
const CUSD_CELO = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export type TokenType = "NATIVE" | "STABLE";

function getTokenConfig(chainId: number) {
  if (chainId === 42220) {
    return { nativeLabel: "CELO", stableLabel: "cUSD", stableAddress: CUSD_CELO };
  }
  // Default: Base (and others)
  return { nativeLabel: "ETH", stableLabel: "USDC", stableAddress: USDC_BASE };
}

/**
 * Manages the selected payment token and USDC allowance helpers for factory deposits.
 */
export function useTokenSelector() {
  const [selectedToken, setSelectedToken] = useState<TokenType>("NATIVE");
  const { address: wallet } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getFactoryAddress(chainId);
  const { writeContractAsync, isPending: isApproving } = useWriteContract();
  const { nativeLabel, stableLabel, stableAddress } = getTokenConfig(chainId);

  const isUSDC = selectedToken === "STABLE";
  const tokenAddress: `0x${string}` = isUSDC ? stableAddress : ZERO_ADDRESS;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: stableAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [wallet ?? ZERO_ADDRESS, factoryAddress],
    chainId,
    query: { enabled: isUSDC && !!wallet, refetchInterval: 5_000 },
  });

  const { data: usdcBalance } = useReadContract({
    address: stableAddress,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [wallet ?? ZERO_ADDRESS],
    chainId,
    query: { enabled: isUSDC && !!wallet, refetchInterval: 10_000 },
  });

  async function approveUSDC(amountDisplay: string) {
    const amount = parseUnits(amountDisplay, 6);
    const gross = (amount * 101n) / 100n;
    await writeContractAsync({
      address: stableAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [factoryAddress, gross],
      chainId,
    });
    await refetchAllowance();
  }

  function isApproved(amountDisplay: string): boolean {
    if (!isUSDC || !allowance) return false;
    try {
      const needed = parseUnits(amountDisplay, 6);
      return (allowance as bigint) >= needed;
    } catch { return false; }
  }

  function parseTokenAmount(display: string): bigint {
    if (!display || isNaN(parseFloat(display))) return 0n;
    return isUSDC ? parseUnits(display, 6) : parseUnits(display, 18);
  }

  function formatTokenAmount(raw: bigint): string {
    return isUSDC ? formatUnits(raw, 6) : formatUnits(raw, 18);
  }

  return {
    selectedToken,
    setSelectedToken,
    tokenAddress,
    isUSDC,
    nativeLabel,
    stableLabel,
    allowance: allowance as bigint | undefined,
    usdcBalance: usdcBalance as bigint | undefined,
    approveUSDC,
    isApproving,
    isApproved,
    parseTokenAmount,
    formatTokenAmount,
  };
}
