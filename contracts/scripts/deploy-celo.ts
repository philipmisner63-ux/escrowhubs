import hre from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
config();

async function main() {
  const conn = await hre.network.connect();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
  const account = privateKeyToAccount(privateKey);
  console.log("Deploying with account:", account.address);
  console.log("Network: Celo mainnet (42220)");

  // TrustScoreOracle already deployed
  const oracleAddress = "0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as `0x${string}`;
  console.log("✅ TrustScoreOracle (existing):", oracleAddress);

  // 2. EscrowFactory
  const factory = await conn.viem.deployContract("EscrowFactory", []);
  console.log("✅ EscrowFactory:   ", factory.address);

  // 3. AIArbiter
  const aiArbiter = await conn.viem.deployContract("AIArbiter", [account.address]);
  console.log("✅ AIArbiter:       ", aiArbiter.address);

  // 4. Wire AIArbiter into factory
  const factoryClient = await conn.viem.getContractAt("EscrowFactory", factory.address);
  await factoryClient.write.setAIArbiter([aiArbiter.address]);
  console.log("✅ Factory wired to AIArbiter");

  console.log("\n=== Celo Deployment Summary ===");
  console.log("TrustScoreOracle:", oracleAddress);
  console.log("EscrowFactory:   ", factory.address);
  console.log("AIArbiter:       ", aiArbiter.address);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
