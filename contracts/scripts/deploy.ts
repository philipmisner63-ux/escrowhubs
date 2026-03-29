import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // --- SimpleEscrow ---
  // Replace with real beneficiary/arbiter addresses before deploying
  const beneficiary = process.env.BENEFICIARY_ADDRESS || deployer.address;
  const arbiter     = process.env.ARBITER_ADDRESS     || deployer.address;

  const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
  const simple = await SimpleEscrow.deploy(beneficiary, arbiter);
  await simple.waitForDeployment();
  console.log("SimpleEscrow deployed to:", await simple.getAddress());

  // --- MilestoneEscrow (example: 3 milestones) ---
  const descriptions = ["Kickoff", "Delivery", "Final"];
  const amounts = [
    ethers.parseEther("0.1"),
    ethers.parseEther("0.5"),
    ethers.parseEther("0.4"),
  ];

  const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
  const milestone = await MilestoneEscrow.deploy(beneficiary, arbiter, descriptions, amounts);
  await milestone.waitForDeployment();
  console.log("MilestoneEscrow deployed to:", await milestone.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
