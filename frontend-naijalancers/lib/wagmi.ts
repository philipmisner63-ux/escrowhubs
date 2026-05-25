import { createConfig, http } from "wagmi";
import { celo } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "9401741cff120268fe4e4df8acbda44f";

export const config = createConfig({
  chains: [celo],
  connectors: [
    injected(),
    walletConnect({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: "NaijaLancers Escrow",
        description: "Secure escrow for Nigerian freelancers",
        url: "https://marketplace.escrowhubs.io",
        icons: ["https://marketplace.escrowhubs.io/favicon.ico"],
      },
    }),
  ],
  transports: {
    [celo.id]: http("https://rpc.ankr.com/celo"),
  },
});

export type Config = typeof config;
