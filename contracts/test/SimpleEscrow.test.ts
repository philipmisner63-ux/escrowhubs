import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleEscrow", function () {
  let escrow: SimpleEscrow;
  let depositor: HardhatEthersSigner;
  let beneficiary: HardhatEthersSigner;
  let arbiter: HardhatEthersSigner;
  const AMOUNT = ethers.parseEther("1.0");

  beforeEach(async () => {
    [depositor, beneficiary, arbiter] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SimpleEscrow", depositor);
    escrow = await Factory.deploy(beneficiary.address, arbiter.address);
    await escrow.waitForDeployment();
  });

  it("accepts deposit from depositor", async () => {
    await expect(escrow.deposit({ value: AMOUNT }))
      .to.emit(escrow, "Deposited")
      .withArgs(depositor.address, AMOUNT);
    expect(await escrow.state()).to.equal(1); // AWAITING_DELIVERY
  });

  it("releases funds to beneficiary", async () => {
    await escrow.deposit({ value: AMOUNT });
    await expect(escrow.release())
      .to.emit(escrow, "Released")
      .withArgs(beneficiary.address, AMOUNT);
  });

  it("arbiter can resolve dispute in favour of beneficiary", async () => {
    await escrow.deposit({ value: AMOUNT });
    await escrow.dispute();
    await expect(escrow.connect(arbiter).resolveRelease())
      .to.emit(escrow, "Released");
  });

  it("arbiter can refund depositor", async () => {
    await escrow.deposit({ value: AMOUNT });
    await escrow.dispute();
    await expect(escrow.connect(arbiter).resolveRefund())
      .to.emit(escrow, "Refunded");
  });
});
