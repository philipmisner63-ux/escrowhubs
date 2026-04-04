import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseMainnet } from "@/lib/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "EscrowHubs",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appDescription: "Trustless escrow on Base",
  appUrl: "https://base.escrowhubs.io",
  appIcon: "https://base.escrowhubs.io/icon.png",
  chains: [baseMainnet],
  ssr: true,
});
