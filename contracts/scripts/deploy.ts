import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  const conn = await hre.network.connect();
  const [deployer] = await conn.viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);
  console.log("Network:", hre.config.defaultChainType);

  // Replace with real beneficiary/arbiter addresses before deploying to testnet
  const beneficiary = process.env.BENEFICIARY_ADDRESS ?? deployer.account.address;
  const arbiter     = process.env.ARBITER_ADDRESS     ?? deployer.account.address;

  // --- SimpleEscrow ---
  const simple = await conn.viem.deployContract("SimpleEscrow", [
    beneficiary as `0x${string}`,
    arbiter     as `0x${string}`,
  ]);
  console.log("SimpleEscrow deployed to:", simple.address);

  // --- MilestoneEscrow (example: 3 milestones) ---
  const descriptions = ["Kickoff", "Delivery", "Final"];
  const amounts = [
    parseEther("0.1"),
    parseEther("0.5"),
    parseEther("0.4"),
  ];

  const milestone = await conn.viem.deployContract("MilestoneEscrow", [
    beneficiary as `0x${string}`,
    arbiter     as `0x${string}`,
    descriptions,
    amounts,
  ]);
  console.log("MilestoneEscrow deployed to:", milestone.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
