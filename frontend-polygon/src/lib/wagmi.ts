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
import { polygonMainnet } from "@/lib/chains";

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
    appDescription: "Trustless escrow on Polygon",
    appUrl: "https://polygon.escrowhubs.io",
    appIcon: "https://polygon.escrowhubs.io/icon.png",
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [polygonMainnet],
  transports: {
    [polygonMainnet.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-mainnet.g.alchemy.com/v2/YUs_6FzIKG617Yt8pMqay"),
  },
  ssr: true,
});
