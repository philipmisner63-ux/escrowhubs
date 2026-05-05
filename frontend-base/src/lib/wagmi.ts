import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { baseMainnet, celoMainnet } from "@/lib/chains";
import { Attribution } from "ox/erc8021";

// Base Builder Code — attributes all EscrowHubs transactions for rewards
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_7z5atl48"],
});

const COINBASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const wagmiAdapter = new WagmiAdapter({
  networks: [baseMainnet, celoMainnet],
  projectId: PROJECT_ID,
  ssr: true,
  transports: {
    [baseMainnet.id]: http(COINBASE_RPC),
    [celoMainnet.id]: http("https://forno.celo.org"),
  },
  // Note: dataSuffix (Base Builder Code attribution) temporarily removed —
  // WagmiAdapter does not expose this option; pending AppKit support.
  // Original value: DATA_SUFFIX (Attribution.toDataSuffix({ codes: ["bc_7z5atl48"] }))
});

// Suppress unused-variable warning for DATA_SUFFIX until AppKit supports it
void DATA_SUFFIX;

export const wagmiConfig = wagmiAdapter.wagmiConfig;
