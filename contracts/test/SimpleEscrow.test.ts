import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

const AMOUNT = parseEther("1.0");

describe("SimpleEscrow", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
    ]);
    return { escrow, conn, depositor, beneficiary, arbiter };
  }

  it("accepts deposit from depositor", async () => {
    const { escrow } = await deploy();
    await escrow.write.deposit([], { value: AMOUNT });
    const state = await escrow.read.state();
    assert.equal(state, 1); // AWAITING_DELIVERY
  });

  it("releases funds to beneficiary", async () => {
    const { escrow } = await deploy();
    await escrow.write.deposit([], { value: AMOUNT });
    await escrow.write.release();
    const state = await escrow.read.state();
    assert.equal(state, 2); // COMPLETE
  });

  it("arbiter can resolve dispute in favour of beneficiary", async () => {
    const { escrow, arbiter } = await deploy();
    await escrow.write.deposit([], { value: AMOUNT });
    await escrow.write.dispute();
    await escrow.write.resolveRelease([], { account: arbiter.account });
    const state = await escrow.read.state();
    assert.equal(state, 2); // COMPLETE
  });

  it("arbiter can refund depositor", async () => {
    const { escrow, arbiter } = await deploy();
    await escrow.write.deposit([], { value: AMOUNT });
    await escrow.write.dispute();
    await escrow.write.resolveRefund([], { account: arbiter.account });
    const state = await escrow.read.state();
    assert.equal(state, 4); // REFUNDED
  });
});
