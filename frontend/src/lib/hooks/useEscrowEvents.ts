"use client";

import { useState, useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { SIMPLE_ESCROW_ABI, MILESTONE_ESCROW_ABI } from "@/lib/contracts";

type Address = `0x${string}`;

export interface EscrowEvent {
  name: string;
  args: Record<string, unknown>;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
  timestamp: number;
}

export function useEscrowEvents(
  address: Address | undefined,
  contractType: "simple" | "milestone" | "unknown"
) {
  const [events, setEvents] = useState<EscrowEvent[]>([]);

  const addEvent = useCallback((name: string, log: unknown) => {
    const l = log as { args?: Record<string, unknown>; blockNumber?: bigint | null; transactionHash?: `0x${string}` | null };
    const ev: EscrowEvent = {
      name,
      args: l.args ?? {},
      blockNumber: l.blockNumber ?? undefined,
      transactionHash: l.transactionHash ?? undefined,
      timestamp: Date.now(),
    };
    setEvents(prev => [ev, ...prev].slice(0, 50));
  }, []);

  const isSimple = contractType === "simple";
  const isMilestone = contractType === "milestone";

  useWatchContractEvent({
    address,
    abi: SIMPLE_ESCROW_ABI,
    eventName: "Deposited",
    onLogs: logs => logs.forEach(l => addEvent("Deposited", l)),
    enabled: !!address && isSimple,
  });

  useWatchContractEvent({
    address,
    abi: SIMPLE_ESCROW_ABI,
    eventName: "Released",
    onLogs: logs => logs.forEach(l => addEvent("Released", l)),
    enabled: !!address && isSimple,
  });

  useWatchContractEvent({
    address,
    abi: SIMPLE_ESCROW_ABI,
    eventName: "Refunded",
    onLogs: logs => logs.forEach(l => addEvent("Refunded", l)),
    enabled: !!address && isSimple,
  });

  useWatchContractEvent({
    address,
    abi: SIMPLE_ESCROW_ABI,
    eventName: "Disputed",
    onLogs: logs => logs.forEach(l => addEvent("Disputed", l)),
    enabled: !!address && isSimple,
  });

  useWatchContractEvent({
    address,
    abi: MILESTONE_ESCROW_ABI,
    eventName: "Funded",
    onLogs: logs => logs.forEach(l => addEvent("Funded", l)),
    enabled: !!address && isMilestone,
  });

  useWatchContractEvent({
    address,
    abi: MILESTONE_ESCROW_ABI,
    eventName: "MilestoneReleased",
    onLogs: logs => logs.forEach(l => addEvent("MilestoneReleased", l)),
    enabled: !!address && isMilestone,
  });

  useWatchContractEvent({
    address,
    abi: MILESTONE_ESCROW_ABI,
    eventName: "MilestoneDisputed",
    onLogs: logs => logs.forEach(l => addEvent("MilestoneDisputed", l)),
    enabled: !!address && isMilestone,
  });

  useWatchContractEvent({
    address,
    abi: MILESTONE_ESCROW_ABI,
    eventName: "MilestoneRefunded",
    onLogs: logs => logs.forEach(l => addEvent("MilestoneRefunded", l)),
    enabled: !!address && isMilestone,
  });

  return { events };
}
