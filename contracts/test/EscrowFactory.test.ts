import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

describe("EscrowFactory", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [owner, beneficiary, arbiter, other] = await conn.viem.getWalletClients();

    const factory = await conn.viem.deployContract("EscrowFactory", []);
    return { factory, conn, owner, beneficiary, arbiter, other };
  }

  it("creates a SimpleEscrow and records it", async () => {
    const { factory, beneficiary, arbiter, conn } = await deploy();
    const publicClient = await conn.viem.getPublicClient();

    const hash = await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0],
      { value: parseEther("1.0") }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);

    const record = await factory.read.escrows([0n]);
    assert.equal(record[3].toLowerCase(), beneficiary.account.address.toLowerCase()); // beneficiary
    assert.equal(record[6], 0); // trustTier = Standard
  });

  it("creates a MilestoneEscrow and records it", async () => {
    const { factory, beneficiary, arbiter } = await deploy();

    const descriptions = ["Phase 1", "Phase 2"];
    const amounts = [parseEther("0.5"), parseEther("0.5")];
    const total = parseEther("1.0");

    await factory.write.createMilestoneEscrow(
      [
        getAddress(beneficiary.account.address),
        getAddress(arbiter.account.address),
        descriptions,
        amounts,
        1, // Enhanced tier
      ],
      { value: total }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);

    const record = await factory.read.escrows([0n]);
    assert.equal(record[1], 1); // EscrowType.MILESTONE
    assert.equal(record[6], 1); // trustTier = Enhanced
  });

  it("indexes escrows by depositor", async () => {
    const { factory, beneficiary, arbiter, owner } = await deploy();

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0],
      { value: parseEther("0.5") }
    );
    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0],
      { value: parseEther("0.5") }
    );

    const indices = await factory.read.getEscrowsByDepositor([getAddress(owner.account.address)]);
    assert.equal(indices.length, 2);
  });

  it("returns paginated escrows", async () => {
    const { factory, beneficiary, arbiter } = await deploy();

    for (let i = 0; i < 3; i++) {
      await factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0],
        { value: parseEther("0.1") }
      );
    }

    const page = await factory.read.getEscrows([0n, 2n]);
    assert.equal(page.length, 2);

    const page2 = await factory.read.getEscrows([2n, 2n]);
    assert.equal(page2.length, 1);
  });
});
