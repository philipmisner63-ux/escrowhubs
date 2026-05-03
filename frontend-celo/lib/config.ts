import { http, createConfig } from "wagmi";
import { celo } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const WC_PROJECT_ID = "9401741cff120268fe4e4df8acbda44f";

// Celo mainnet — supports MiniPay, MetaMask, Valora, WalletConnect
export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [
    injected(),
    walletConnect({
      projectId: WC_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: "EscrowHubs",
        description: "Safe payments on Celo",
        url: "https://celo.escrowhubs.io",
        icons: ["https://celo.escrowhubs.io/icon.png"],
      },
    }),
  ],
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

// Celo USDT
export const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`;

export const TOKENS = {
  cUSD: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
  USDT: {
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// App fee (0.5%)
export const FEE_BPS = 50n;
