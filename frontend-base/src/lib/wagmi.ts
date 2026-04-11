import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseMainnet, celoMainnet } from "@/lib/chains";
import { Attribution } from "ox/erc8021";

// Base Builder Code — attributes all EscrowHubs transactions for rewards
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_7z5atl48"],
});

const COINBASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

export const wagmiConfig = getDefaultConfig({
  appName: "EscrowHubs",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appDescription: "Trustless escrow on Base and Celo",
  appUrl: "https://base.escrowhubs.io",
  appIcon: "https://base.escrowhubs.io/icon.png",
  chains: [baseMainnet, celoMainnet],
  transports: {
    [baseMainnet.id]: http(COINBASE_RPC),
    [celoMainnet.id]: http("https://forno.celo.org"),
  },
  ssr: true,
  dataSuffix: DATA_SUFFIX,
});
