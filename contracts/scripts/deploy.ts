import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  const conn = await hre.network.connect();
  const [deployer] = await conn.viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);
  console.log("Network:", hre.config.defaultChainType);

  // 1. TrustScoreOracle
  const oracle = await conn.viem.deployContract("TrustScoreOracle", []);
  console.log("TrustScoreOracle deployed to:", oracle.address);

  // 2. EscrowFactory
  const factory = await conn.viem.deployContract("EscrowFactory", []);
  console.log("EscrowFactory deployed to:", factory.address);

  // 3. Standalone contracts (for direct use without factory)
  const beneficiary = (process.env.BENEFICIARY_ADDRESS ?? deployer.account.address) as `0x${string}`;
  const arbiter     = (process.env.ARBITER_ADDRESS     ?? deployer.account.address) as `0x${string}`;

  const simple = await conn.viem.deployContract("SimpleEscrow", [beneficiary, arbiter]);
  console.log("SimpleEscrow deployed to:", simple.address);

  const descriptions = ["Kickoff", "Delivery", "Final"];
  const amounts = [parseEther("0.1"), parseEther("0.5"), parseEther("0.4")];

  const milestone = await conn.viem.deployContract("MilestoneEscrow", [
    beneficiary, arbiter, descriptions, amounts,
  ]);
  console.log("MilestoneEscrow deployed to:", milestone.address);

  console.log("\n=== Deployment Summary ===");
  console.log("TrustScoreOracle:", oracle.address);
  console.log("EscrowFactory:   ", factory.address);
  console.log("SimpleEscrow:    ", simple.address);
  console.log("MilestoneEscrow: ", milestone.address);
  console.log("\nAdd these to your .env:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factory.address}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${oracle.address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
