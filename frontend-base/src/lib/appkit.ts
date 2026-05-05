import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter } from "./wagmi";
import { baseMainnet, celoMainnet } from "@/lib/chains";

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [baseMainnet, celoMainnet],
  defaultNetwork: baseMainnet,
  projectId: PROJECT_ID,
  metadata: {
    name: "EscrowHubs",
    description: "Trustless escrow on Base and Celo",
    url: "https://base.escrowhubs.io",
    icons: ["https://base.escrowhubs.io/icon.png"],
  },
  features: {
    analytics: true,
  },
});
