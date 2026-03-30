import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { blockdagTestnet } from "./contracts";

export const wagmiConfig = getDefaultConfig({
  appName: "BlockDAG Escrow",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [blockdagTestnet, sepolia, mainnet],
  ssr: true,
});
