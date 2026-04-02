import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, type Chain } from "wagmi/chains";
import { getDefaultChain } from "@/lib/chainRegistry";

const { chain: blockdagChainDef } = getDefaultChain();
// Cast to wagmi Chain type — BlockDAG is a custom EVM-compatible chain
const blockdagChain = blockdagChainDef as unknown as Chain;

export const wagmiConfig = getDefaultConfig({
  appName: "BlockDAG Escrow",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appDescription: "Trustless escrow contracts on BlockDAG",
  appUrl: "https://app.escrowhubs.io",
  appIcon: "https://app.escrowhubs.io/icon.png",
  chains: [blockdagChain, sepolia, mainnet],
  ssr: true,
});
