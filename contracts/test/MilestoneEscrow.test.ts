import { expect } from "chai";
import { ethers } from "hardhat";
import { MilestoneEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MilestoneEscrow", function () {
  let escrow: MilestoneEscrow;
  let depositor: HardhatEthersSigner;
  let beneficiary: HardhatEthersSigner;
  let arbiter: HardhatEthersSigner;

  const descriptions = ["Kickoff", "Delivery", "Final"];
  const amounts = [
    ethers.parseEther("0.1"),
    ethers.parseEther("0.5"),
    ethers.parseEther("0.4"),
  ];
  const total = amounts.reduce((a, b) => a + b, 0n);

  beforeEach(async () => {
    [depositor, beneficiary, arbiter] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MilestoneEscrow", depositor);
    escrow = await Factory.deploy(beneficiary.address, arbiter.address, descriptions, amounts);
    await escrow.waitForDeployment();
  });

  it("funds the contract with exact total", async () => {
    await expect(escrow.fund({ value: total }))
      .to.emit(escrow, "Funded")
      .withArgs(total);
  });

  it("releases a milestone to beneficiary", async () => {
    await escrow.fund({ value: total });
    await expect(escrow.releaseMilestone(0))
      .to.emit(escrow, "MilestoneReleased")
      .withArgs(0, amounts[0]);
  });

  it("arbiter resolves disputed milestone", async () => {
    await escrow.fund({ value: total });
    await escrow.disputeMilestone(1);
    await expect(escrow.connect(arbiter).resolveRelease(1))
      .to.emit(escrow, "MilestoneReleased");
  });

  it("arbiter can refund a disputed milestone", async () => {
    await escrow.fund({ value: total });
    await escrow.disputeMilestone(2);
    await expect(escrow.connect(arbiter).resolveRefund(2))
      .to.emit(escrow, "MilestoneRefunded");
  });
});
