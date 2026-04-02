// ─── Chain config (canonical source: chainRegistry.ts) ───────────────────────
export { getChain, getDefaultChain, chainRegistry, DEFAULT_CHAIN_ID } from "@/lib/chainRegistry";
import { getDefaultChain, chainRegistry, DEFAULT_CHAIN_ID } from "@/lib/chainRegistry";

// Re-export blockdagTestnet for backward compat with existing hook imports
export const blockdagTestnet = getDefaultChain().chain;

// ─── ABIs ────────────────────────────────────────────────────────────────────

export const SIMPLE_ESCROW_ABI = [
  // State variables
  { type: "function", name: "state",       inputs: [], outputs: [{ type: "uint8" }],    stateMutability: "view" },
  { type: "function", name: "depositor",   inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "beneficiary", inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "arbiter",     inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "amount",      inputs: [], outputs: [{ type: "uint256" }],  stateMutability: "view" },
  // Write
  { type: "function", name: "deposit",        inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "release",        inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "dispute",        inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",  inputs: [], outputs: [], stateMutability: "nonpayable" },
  // Events
  { type: "event", name: "Deposited", inputs: [{ name: "depositor", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Released",  inputs: [{ name: "to",        type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Refunded",  inputs: [{ name: "to",        type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Disputed",  inputs: [{ name: "by",        type: "address", indexed: true }] },
] as const;

export const MILESTONE_ESCROW_ABI = [
  // State variables
  { type: "function", name: "depositor",      inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "beneficiary",    inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "arbiter",        inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeposited", inputs: [],                            outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "funded",         inputs: [],                            outputs: [{ type: "bool" }],    stateMutability: "view" },
  { type: "function", name: "milestoneCount", inputs: [],                            outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "milestones",     inputs: [{ name: "index", type: "uint256" }], outputs: [{ name: "description", type: "string" }, { name: "amount", type: "uint256" }, { name: "state", type: "uint8" }], stateMutability: "view" },
  // Write
  { type: "function", name: "fund",              inputs: [],                                    outputs: [], stateMutability: "payable" },
  { type: "function", name: "releaseMilestone",  inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "disputeMilestone",  inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease",    inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",     inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // Events
  { type: "event", name: "Funded",              inputs: [{ name: "total",  type: "uint256", indexed: false }] },
  { type: "event", name: "MilestoneReleased",   inputs: [{ name: "index",  type: "uint256", indexed: true  }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "MilestoneDisputed",   inputs: [{ name: "index",  type: "uint256", indexed: true  }] },
  { type: "event", name: "MilestoneRefunded",   inputs: [{ name: "index",  type: "uint256", indexed: true  }, { name: "amount", type: "uint256", indexed: false }] },
] as const;

// Bytecodes removed — not needed in client bundle (deploy via hardhat scripts only)

// ─── AIArbiter ABI ────────────────────────────────────────────────────────────

export const AI_ARBITER_ABI = [
  // Write
  { type: "function", name: "submitEvidence",           inputs: [{ name: "escrowAddress", type: "address" }, { name: "evidenceURI", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease",           inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",            inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRelease",  inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRefund",   inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setOracleSigner",          inputs: [{ name: "newSigner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  // Views
  { type: "function", name: "owner",              inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "oracleSigner",       inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getEvidenceCount",   inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getEvidence",        inputs: [{ name: "escrowAddress", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ name: "submitter", type: "address" }, { name: "uri", type: "string" }, { name: "submittedAt", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAllEvidence",     inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "tuple[]", components: [{ name: "submitter", type: "address" }, { name: "uri", type: "string" }, { name: "submittedAt", type: "uint256" }] }], stateMutability: "view" },
  // Events
  { type: "event", name: "EvidenceSubmitted",   inputs: [{ name: "escrow", type: "address", indexed: true }, { name: "submitter", type: "address", indexed: true }, { name: "evidenceURI", type: "string", indexed: false }] },
  { type: "event", name: "DisputeResolved",     inputs: [{ name: "escrow", type: "address", indexed: true }, { name: "resolution", type: "string", indexed: false }] },
  { type: "event", name: "OracleSignerUpdated", inputs: [{ name: "newSigner", type: "address", indexed: true }] },
] as const;

// ─── EscrowFactory ABI ───────────────────────────────────────────────────────

export const ESCROW_FACTORY_ABI = [
  // Write
  { type: "function", name: "createSimpleEscrow",    inputs: [{ name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "trustTier", type: "uint8" }, { name: "useAIArbiter", type: "bool" }], outputs: [{ type: "address" }], stateMutability: "payable" },
  { type: "function", name: "createMilestoneEscrow", inputs: [{ name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "descriptions", type: "string[]" }, { name: "amounts", type: "uint256[]" }, { name: "trustTier", type: "uint8" }, { name: "useAIArbiter", type: "bool" }], outputs: [{ type: "address" }], stateMutability: "payable" },
  { type: "function", name: "setAIArbiter",          inputs: [{ name: "_aiArbiter", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  // Views
  { type: "function", name: "escrowCount",              inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "escrows",                  inputs: [{ name: "index", type: "uint256" }], outputs: [{ name: "contractAddress", type: "address" }, { name: "escrowType", type: "uint8" }, { name: "depositor", type: "address" }, { name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "fee", type: "uint256" }, { name: "trustTier", type: "uint8" }, { name: "aiArbiter", type: "bool" }, { name: "createdAt", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getEscrowsByDepositor",    inputs: [{ name: "depositor", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getEscrowsByBeneficiary",  inputs: [{ name: "beneficiary", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getEscrows",               inputs: [{ name: "offset", type: "uint256" }, { name: "limit", type: "uint256" }], outputs: [{ type: "tuple[]", components: [{ name: "contractAddress", type: "address" }, { name: "escrowType", type: "uint8" }, { name: "depositor", type: "address" }, { name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "fee", type: "uint256" }, { name: "trustTier", type: "uint8" }, { name: "aiArbiter", type: "bool" }, { name: "createdAt", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "escrowIndex",              inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // Events
  { type: "event", name: "SimpleEscrowCreated",    inputs: [{ name: "contractAddress", type: "address", indexed: true }, { name: "depositor", type: "address", indexed: true }, { name: "beneficiary", type: "address", indexed: true }, { name: "arbiter", type: "address", indexed: false }, { name: "amount", type: "uint256", indexed: false }, { name: "trustTier", type: "uint8", indexed: false }] },
  { type: "event", name: "MilestoneEscrowCreated", inputs: [{ name: "contractAddress", type: "address", indexed: true }, { name: "depositor", type: "address", indexed: true }, { name: "beneficiary", type: "address", indexed: true }, { name: "arbiter", type: "address", indexed: false }, { name: "totalAmount", type: "uint256", indexed: false }, { name: "trustTier", type: "uint8", indexed: false }] },
] as const;

// ─── TrustScoreOracle ABI ─────────────────────────────────────────────────────

export const TRUST_ORACLE_ABI = [
  { type: "function", name: "getTier",          inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "uint8" }],  stateMutability: "view" },
  { type: "function", name: "getScoreAndTier",  inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "score", type: "uint8" }, { name: "tier", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "scores",           inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "uint8" }],  stateMutability: "view" },
  { type: "function", name: "tier1Threshold",   inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "tier2Threshold",   inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;

// Contract addresses + chain config now sourced from chainRegistry.ts
export const FACTORY_ADDRESS    = chainRegistry[DEFAULT_CHAIN_ID].contractAddresses.factory;
export const ORACLE_ADDRESS     = chainRegistry[DEFAULT_CHAIN_ID].contractAddresses.oracle;
export const AI_ARBITER_ADDRESS = chainRegistry[DEFAULT_CHAIN_ID].contractAddresses.aiArbiter;
export const EXPLORER_TX_URL    = (hash: string) => getDefaultChain().explorerTxUrl(hash);

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SimpleEscrowState {
  AWAITING_PAYMENT  = 0,
  AWAITING_DELIVERY = 1,
  COMPLETE          = 2,
  DISPUTED          = 3,
  REFUNDED          = 4,
}

export enum MilestoneState {
  PENDING  = 0,
  RELEASED = 1,
  DISPUTED = 2,
  REFUNDED = 3,
}

export const SIMPLE_STATE_LABEL: Record<number, string> = {
  0: "Awaiting Payment",
  1: "Awaiting Delivery",
  2: "Complete",
  3: "Disputed",
  4: "Refunded",
};

export const MILESTONE_STATE_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Released",
  2: "Disputed",
  3: "Refunded",
};
