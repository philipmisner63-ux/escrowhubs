import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { celo } from "wagmi/chains";

const WC_PROJECT_ID = "9401741cff120268fe4e4df8acbda44f";

// Celo mainnet — supports MiniPay, MetaMask, Valora, WalletConnect
export const wagmiAdapter = new WagmiAdapter({
  networks: [celo],
  projectId: WC_PROJECT_ID,
  ssr: true,
  transports: {
    [celo.id]: http("https://rpc.ankr.com/celo"),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Contract addresses (Celo mainnet — deployed 2026-05-08, with per-referrer BPS + volume tracking)
export const CONTRACTS = {
  factory:    "0x2fcec726073a47b71242f24fa3821d299b5119e1" as `0x${string}`,
  arbiter:    "0x34dd4dda6d704ddbc0b800a7eaff3fea710eba9c" as `0x${string}`,
  trustOracle:"0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as `0x${string}`,
} as const;

// ┌── Stablecoins ───────────────────────────────────────────┐
export const CUSD  = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;
export const USDT  = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`;
export const USDm  = "0xE4d517449C03cb062284b8C5b34D2692C0E5e6C6" as `0x${string}`; // Mento USD
export const NGNm  = "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71" as `0x${string}`; // Mento Naira

// Fee-currency adapters (CIP-64 gas abstraction)
// MiniPay ONLY supports USDm for gas today. Non-MiniPay wallets should use USDC adapter.
export const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`;
export const USDm_FEE   = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`; // cUSD/USDm same addr on Celo

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

export type TokenSymbol = keyof typeof TOKENS;

// App fee (0.5%)
export const FEE_BPS = 50n;

// ┌── Fee-currency helpers ──────────────────────────────────────────┐
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
