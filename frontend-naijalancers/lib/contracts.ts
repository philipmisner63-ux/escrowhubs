import FactoryJson from "./abi-EscrowFactory.json";
import EscrowJson from "./abi-SimpleEscrow.json";

// Celo mainnet contract addresses (deployed 2026-05-08)
export const CONTRACTS = {
  factory: "0x2fcec726073a47b71242f24fa3821d299b5119e1" as `0x${string}`,
  arbiter: "0x34dd4dda6d704ddbc0b800a7eaff3fea710eba9c" as `0x${string}`,
  trustOracle: "0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as `0x${string}`,
} as const;

export const CUSD  = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;
export const USDT  = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`;
export const USDm  = "0xE4d517449C03cb062284b8C5b34D2692C0E5e6C6" as `0x${string}`;
export const NGNm  = "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71" as `0x${string}`;

// Fee-currency adapters (CIP-64 gas abstraction)
export const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`;
export const USDm_FEE     = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

export const TOKENS = {
  cUSD: {
    address: CUSD,
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
  USDT: {
    address: USDT,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  USDm: {
    address: USDm,
    symbol: "USDm",
    name: "Mento Dollar",
    decimals: 18,
  },
  NGNm: {
    address: NGNm,
    symbol: "NGNm",
    name: "Mento Naira",
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

/**
 * Return the correct feeCurrency address for the current wallet environment.
 * - MiniPay (window.ethereum.isMiniPay) → USDm (only token MiniPay supports for gas)
 * - Everything else → USDC adapter (cheapest, most broadly held)
 */
export function getFeeCurrency(): `0x${string}` {
  if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
    return USDm_FEE;
  }
  return USDC_ADAPTER;
}
