export const GAS_LIMITS = {
  // Factory deployment operations (higher gas — contract creation)
  deploySimpleEscrow: 1_100_000n,
  deployMilestoneEscrow: 2_000_000n,

  // Simple escrow operations
  deposit: 150_000n,
  release: 100_000n,
  refund: 100_000n,
  raiseDispute: 120_000n,
  resolveDispute: 150_000n,

  // Milestone escrow operations
  depositMilestone: 150_000n,
  approveMilestone: 120_000n,
  disputeMilestone: 120_000n,
  resolveMilestoneDispute: 150_000n,

  // Default fallback
  default: 200_000n,
} as const;
