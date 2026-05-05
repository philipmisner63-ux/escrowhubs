import { createAppKit } from "@reown/appkit/react";
import { celo } from "wagmi/chains";
import { wagmiAdapter } from "./config";

const WC_PROJECT_ID = "9401741cff120268fe4e4df8acbda44f";

export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo],
  defaultNetwork: celo,
  projectId: WC_PROJECT_ID,
  metadata: {
    name: "EscrowHubs",
    description: "Safe payments on Celo",
    url: "https://celo.escrowhubs.io",
    icons: ["https://celo.escrowhubs.io/icon.png"],
  },
  features: {
    analytics: true,
  },
});
