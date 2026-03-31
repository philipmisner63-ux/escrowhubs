import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

const descriptions = ["Kickoff", "Delivery", "Final"];
const amounts = [parseEther("0.1"), parseEther("0.5"), parseEther("0.4")];
const total = amounts.reduce((a, b) => a + b, 0n);

describe("MilestoneEscrow", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      descriptions,
      amounts,
    ]);
    return { escrow, conn, depositor, beneficiary, arbiter };
  }

  it("funds the contract with exact total", async () => {
    const { escrow } = await deploy();
    await escrow.write.fund([], { value: total });
    const funded = await escrow.read.funded();
    assert.equal(funded, true);
  });

  it("releases a milestone to beneficiary", async () => {
    const { escrow } = await deploy();
    await escrow.write.fund([], { value: total });
    await escrow.write.releaseMilestone([0n]);
    const [, , state] = await escrow.read.milestones([0n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter resolves disputed milestone", async () => {
    const { escrow, arbiter } = await deploy();
    await escrow.write.fund([], { value: total });
    await escrow.write.disputeMilestone([1n]);
    await escrow.write.resolveRelease([1n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([1n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter can refund a disputed milestone", async () => {
    const { escrow, arbiter } = await deploy();
    await escrow.write.fund([], { value: total });
    await escrow.write.disputeMilestone([2n]);
    await escrow.write.resolveRefund([2n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([2n]);
    assert.equal(state, 3); // REFUNDED
  });
});
