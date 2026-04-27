import { http, createConfig } from "wagmi";
import { celo } from "wagmi/chains";

// Celo mainnet only — this app is purpose-built for MiniPay
export const wagmiConfig = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
  },
});

// Contract addresses (Celo mainnet — deployed 2026-04-11)
export const CONTRACTS = {
  factory:    "0x43572a85597e82a7153dbcae8f2fe93d1602a836" as `0x${string}`,
  arbiter:    "0x73198f6bdf2537bcd6138e35175498c631c5b42b" as `0x${string}`,
  trustOracle:"0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as `0x${string}`,
} as const;

// cUSD — primary stablecoin for this app
export const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

// App fee (0.5%)
export const FEE_BPS = 50n;
