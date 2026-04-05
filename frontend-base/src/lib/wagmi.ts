import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseMainnet } from "@/lib/chains";
import { Attribution } from "ox/erc8021";

// Base Builder Code — attributes all EscrowHubs transactions for rewards
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_7z5atl48"],
});

// Always use our Coinbase RPC for reads and gas estimation
// This overrides whatever RPC the user's wallet (MetaMask/etc) is configured with
const COINBASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

export const wagmiConfig = getDefaultConfig({
  appName: "EscrowHubs",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appDescription: "Trustless escrow on Base",
  appUrl: "https://base.escrowhubs.io",
  appIcon: "https://base.escrowhubs.io/icon.png",
  chains: [baseMainnet],
  transports: {
    [baseMainnet.id]: http(COINBASE_RPC),
  },
  ssr: true,
  dataSuffix: DATA_SUFFIX,
});
