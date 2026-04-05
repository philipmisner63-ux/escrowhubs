import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseMainnet } from "@/lib/chains";
import { Attribution } from "ox/erc8021";

// Base Builder Code — attributes all EscrowHubs transactions for rewards
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_7z5atl48"],
});

export const wagmiConfig = getDefaultConfig({
  appName: "EscrowHubs",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appDescription: "Trustless escrow on Base",
  appUrl: "https://base.escrowhubs.io",
  appIcon: "https://base.escrowhubs.io/icon.png",
  chains: [baseMainnet],
  ssr: true,
  dataSuffix: DATA_SUFFIX,
});
