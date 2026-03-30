import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

// BlockDAG chain (placeholder — update when testnet details available)
export const blockdagTestnet = {
  id: 1043,
  name: "BlockDAG Testnet",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL ?? "https://rpc-testnet.blockdag.network"] },
  },
  blockExplorers: {
    default: { name: "BlockDAG Explorer", url: "https://explorer-testnet.blockdag.network" },
  },
  testnet: true,
} as const;

export const wagmiConfig = getDefaultConfig({
  appName: "BlockDAG Escrow",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [blockdagTestnet, sepolia, mainnet],
  ssr: true,
});
