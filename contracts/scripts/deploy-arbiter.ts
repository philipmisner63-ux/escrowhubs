import hre from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
config();

async function main() {
  const conn = await hre.network.connect();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const account = privateKeyToAccount(privateKey);
  console.log("Deploying AIArbiter with:", account.address);

  const aiArbiter = await conn.viem.deployContract("AIArbiter", [account.address]);
  console.log("✅ AIArbiter:", aiArbiter.address);

  // Wire into existing EscrowFactory
  const factoryAddress = "0x93e86fac9a15add437363f7bbec776bdbc932411";
  const factoryClient = await conn.viem.getContractAt("EscrowFactory", factoryAddress);
  await factoryClient.write.setAIArbiter([aiArbiter.address]);
  console.log("✅ Factory wired to AIArbiter");
}

main().catch((err) => { console.error(err); process.exit(1); });
