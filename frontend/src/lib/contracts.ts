import SimpleEscrowArtifact from "../../../contracts/artifacts/contracts/SimpleEscrow.sol/SimpleEscrow.json";
import MilestoneEscrowArtifact from "../../../contracts/artifacts/contracts/MilestoneEscrow.sol/MilestoneEscrow.json";

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

// ─── Bytecode ─────────────────────────────────────────────────────────────────

export const SIMPLE_ESCROW_BYTECODE    = SimpleEscrowArtifact.bytecode    as `0x${string}`;
export const MILESTONE_ESCROW_BYTECODE = MilestoneEscrowArtifact.bytecode as `0x${string}`;

// ─── Chain config ─────────────────────────────────────────────────────────────

export const blockdagTestnet = {
  id: 1043,
  name: "BlockDAG Testnet",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BLOCKDAG_RPC ?? "http://rpc.bdagscan.com/"],
    },
  },
  blockExplorers: {
    default: { name: "BDAGScan", url: "https://bdagscan.com" },
  },
  testnet: true,
} as const;

export const EXPLORER_TX_URL = (hash: string) =>
  `https://bdagscan.com/tx/${hash}`;

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
