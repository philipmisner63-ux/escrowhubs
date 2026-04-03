/**
 * contracts.ts — thin re-export facade.
 *
 * ABIs now live in:  src/lib/contracts/abis/*.json
 * Addresses now in:  src/lib/contracts/addresses.ts
 * Chain config in:   src/lib/chains/registry.ts
 *
 * All legacy import paths (e.g. import { SIMPLE_ESCROW_ABI } from "@/lib/contracts")
 * continue to work without any changes to call sites.
 */

// ─── ABIs + address helpers (canonical source: contracts/) ───────────────────
export * from "@/lib/contracts/index";

// ─── Chain config ─────────────────────────────────────────────────────────────
export { getChain, getDefaultChain, chainRegistry, DEFAULT_CHAIN_ID } from "@/lib/chainRegistry";
import { getDefaultChain } from "@/lib/chainRegistry";

// Backward-compat alias — some hooks still import blockdagTestnet from contracts
export const blockdagTestnet = getDefaultChain().chain;

export const EXPLORER_TX_URL = (hash: string) => getDefaultChain().explorerTxUrl(hash);

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
