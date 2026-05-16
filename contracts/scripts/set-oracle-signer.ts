import hre from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS as `0x${string}`;
  const newSigner = process.env.NEW_SIGNER as `0x${string}`;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set");
  if (!newSigner) throw new Error("NEW_SIGNER not set");
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");

  const conn = await hre.network.connect();
  const account = privateKeyToAccount(privateKey);
  const networkName = hre.network.name ?? "unknown";

  console.log(`[${networkName}] Setting oracle signer on ${contractAddress}`);
  console.log(`[${networkName}] New signer: ${newSigner}`);
  console.log(`[${networkName}] Owner: ${account.address}`);

  const arbiter = await conn.viem.getContractAt("AIArbiter", contractAddress);
  const txHash = await arbiter.write.setOracleSigner([newSigner]);

  console.log(`[${networkName}] Transaction hash: ${txHash}`);
  console.log(`[${networkName}] Waiting for confirmation...`);

  // Wait for receipt using viem transport
  const publicClient = conn.viem?.publicClient ?? await hre.viem?.getPublicClient();
  if (publicClient) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`[${networkName}] Confirmed in block ${receipt.blockNumber}`);
    console.log(`[${networkName}] Gas used: ${receipt.gasUsed}`);
    console.log(`[${networkName}] Status: ${receipt.status}`);
  } else {
    console.log(`[${networkName}] Tx sent: ${txHash}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
