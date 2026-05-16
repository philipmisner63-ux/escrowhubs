import FactoryJson from "./abi-EscrowFactory.json";
import EscrowJson from "./abi-SimpleEscrow.json";

// Celo mainnet contract addresses (deployed 2026-05-08)
export const CONTRACTS = {
  factory: "0x2fcec726073a47b71242f24fa3821d299b5119e1" as `0x${string}`,
  arbiter: "0x34dd4dda6d704ddbc0b800a7eaff3fea710eba9c" as `0x${string}`,
  trustOracle: "0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as `0x${string}`,
} as const;

export const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

export const TOKENS = {
  cUSD: {
    address: CUSD,
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
} as const;

export const FEE_BPS = 50n;

export { FactoryJson, EscrowJson };

// Minimal ABI for ERC20 approve
export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Minimal ABI for factory createSimpleEscrow
export const FACTORY_ABI = [
  {
    name: "createSimpleEscrow",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "arbiter", type: "address" },
      { name: "trustTier", type: "uint8" },
      { name: "useAIArbiter", type: "bool" },
      { name: "token", type: "address" },
      { name: "referrer", type: "address" },
    ],
    outputs: [{ name: "escrowOut", type: "address" }],
  },
] as const;

export function explorerTxUrl(hash: string) {
  return `https://celoscan.io/tx/${hash}`;
}

export function explorerAddressUrl(addr: string) {
  return `https://celoscan.io/address/${addr}`;
}
