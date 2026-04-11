import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  phantomWallet,
  okxWallet,
  bybitWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { bscMainnet } from "@/lib/chains";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        trustWallet,
        walletConnectWallet,
        rainbowWallet,
        phantomWallet,
        okxWallet,
        bybitWallet,
      ],
    },
  ],
  {
    appName: "EscrowHubs",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    appDescription: "Trustless escrow on BNB Smart Chain",
    appUrl: "https://bsc.escrowhubs.io",
    appIcon: "https://bsc.escrowhubs.io/icon.png",
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [bscMainnet],
  transports: {
    [bscMainnet.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org"),
  },
  ssr: true,
});
