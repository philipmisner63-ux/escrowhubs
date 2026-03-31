import hre from "hardhat";

async function main() {
  const conn = await hre.network.connect();
  const [deployer] = await conn.viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);
  console.log("Network:", hre.network.name);

  // 1. TrustScoreOracle
  const oracle = await conn.viem.deployContract("TrustScoreOracle", []);
  console.log("✅ TrustScoreOracle:", oracle.address);

  // 2. EscrowFactory
  const factory = await conn.viem.deployContract("EscrowFactory", []);
  console.log("✅ EscrowFactory:   ", factory.address);

  // 3. AIArbiter (oracle signer = deployer for now, rotate after deploy)
  const aiArbiter = await conn.viem.deployContract("AIArbiter", [
    deployer.account.address,
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
  console.log(`# Set ORACLE_PRIVATE_KEY to the wallet you want as oracle signer`);
  console.log(`# Then call aiArbiter.setOracleSigner(<oracle-wallet-address>)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
