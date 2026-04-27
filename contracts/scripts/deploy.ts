import hre from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
config();

async function main() {
  const conn = await hre.network.connect();

  const rpcUrl = process.env.BLOCKDAG_RPC_URL ?? "https://rpc.blockdag.engineering";
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const account = privateKeyToAccount(privateKey);
  const networkName = hre.network.name ?? "unknown";
  console.log("Deploying with account:", account.address);
  console.log("Network:", networkName);
  if (networkName === "base" || networkName === "baseSepolia") {
    console.log("Base native USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  }

  // 1. TrustScoreOracle
  const oracle = await conn.viem.deployContract("TrustScoreOracle", []);
  console.log("✅ TrustScoreOracle:", oracle.address);

  // 2. EscrowFactory
  const factory = await conn.viem.deployContract("EscrowFactory", []);
  console.log("✅ EscrowFactory:   ", factory.address);

  // 3. AIArbiter (oracle signer = deployer for now)
  const aiArbiter = await conn.viem.deployContract("AIArbiter", [
    account.address,
  ]);
  console.log("✅ AIArbiter:       ", aiArbiter.address);

  // 4. Wire AIArbiter into factory
  const factoryClient = await conn.viem.getContractAt("EscrowFactory", factory.address);
  await factoryClient.write.setAIArbiter([aiArbiter.address]);
  console.log("✅ Factory wired to AIArbiter");

  console.log("\n=== Deployment Summary ===");
  console.log("TrustScoreOracle:", oracle.address);
  console.log("EscrowFactory:   ", factory.address);
  console.log("AIArbiter:       ", aiArbiter.address);

  console.log("\n📋 Add these to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factory.address}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${oracle.address}`);
  console.log(`NEXT_PUBLIC_AI_ARBITER_ADDRESS=${aiArbiter.address}`);

  console.log("\n📋 Add these to oracle/.env:");
  console.log(`AI_ARBITER_ADDRESS=${aiArbiter.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
