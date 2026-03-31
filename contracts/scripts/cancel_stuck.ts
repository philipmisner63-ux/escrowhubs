import { createWalletClient, createPublicClient, http, parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
config();

const chain = {
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bdagscan.com"] } },
} as const;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(pk);
  
  const walletClient = createWalletClient({ account, chain, transport: http() });
  const publicClient = createPublicClient({ chain, transport: http() });

  const confirmed = await publicClient.getTransactionCount({ address: account.address, blockTag: "latest" });
  const pending   = await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
  console.log(`Confirmed nonce: ${confirmed}, Pending nonce: ${pending}`);

  const gasPrice = parseGwei("300"); // 2x current to replace

  for (let nonce = confirmed; nonce < pending; nonce++) {
    console.log(`Cancelling nonce ${nonce}...`);
    const hash = await walletClient.sendTransaction({
      to: account.address,
      value: 0n,
      nonce,
      gasPrice,
      gas: 21000n,
    });
    console.log(`  Cancel tx: ${hash}`);
  }
  console.log("Done — waiting for cancellations to confirm...");
}

main().catch(console.error);
