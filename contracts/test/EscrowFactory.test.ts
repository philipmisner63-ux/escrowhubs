import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

// EscrowRecord tuple indices:
// 0: contractAddress
// 1: escrowType (0=SIMPLE, 1=MILESTONE)
// 2: depositor
// 3: beneficiary
// 4: arbiter
// 5: totalAmount
// 6: fee
// 7: trustTier
// 8: aiArbiter
// 9: createdAt

describe("EscrowFactory", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [owner, beneficiary, arbiter, other] = await conn.viem.getWalletClients();

    const factory   = await conn.viem.deployContract("EscrowFactory", []);
    const aiArbiter = await conn.viem.deployContract("AIArbiter", [owner.account.address]);

    await factory.write.setAIArbiter([aiArbiter.address]);

    return { factory, aiArbiter, conn, owner, beneficiary, arbiter, other };
  }

  // ─── SimpleEscrow ──────────────────────────────────────────────────────────

  it("creates a SimpleEscrow and records it", async () => {
    const { factory, beneficiary, arbiter } = await deploy();

    const [total] = await factory.read.quoteSimple([parseEther("1.0"), false]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false],
      { value: total }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);

    const record = await factory.read.escrows([0n]);
    assert.equal(record[3].toLowerCase(), beneficiary.account.address.toLowerCase()); // beneficiary
    assert.equal(record[7], 0);     // trustTier = Standard
    assert.equal(record[8], false); // aiArbiter = false
  });

  it("takes a protocol fee on SimpleEscrow creation", async () => {
    const { factory, beneficiary, arbiter, conn } = await deploy();
    const publicClient = await conn.viem.getPublicClient();

    const [total, fee] = await factory.read.quoteSimple([parseEther("1.0"), false]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false],
      { value: total }
    );

    assert.ok(fee > 0n, "Fee should be > 0");

    const accumulated = await factory.read.accumulatedFees();
    // Allow 1 wei rounding difference from integer division
    assert.ok(
      accumulated >= fee - 1n && accumulated <= fee + 1n,
      `Accumulated ${accumulated} should ≈ quoted fee ${fee}`
    );

    const balance = await publicClient.getBalance({ address: factory.address });
    assert.equal(balance, accumulated);
  });

  it("charges AI arbiter fee on top of protocol fee", async () => {
    const { factory } = await deploy();

    const [, feeNoAI]   = await factory.read.quoteSimple([parseEther("1.0"), false]);
    const [, feeWithAI] = await factory.read.quoteSimple([parseEther("1.0"), true]);
    const aiArbiterFee  = await factory.read.aiArbiterFee();

    assert.equal(feeWithAI - feeNoAI, aiArbiterFee);
  });

  it("routes SimpleEscrow to AIArbiter when useAIArbiter=true", async () => {
    const { factory, aiArbiter, beneficiary, arbiter } = await deploy();

    const [total] = await factory.read.quoteSimple([parseEther("1.0"), true]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, true],
      { value: total }
    );

    const record = await factory.read.escrows([0n]);
    assert.equal(record[4].toLowerCase(), aiArbiter.address.toLowerCase()); // arbiter = AIArbiter
    assert.equal(record[8], true); // aiArbiter = true
  });

  // ─── MilestoneEscrow ───────────────────────────────────────────────────────

  it("creates a MilestoneEscrow and records it", async () => {
    const { factory, beneficiary, arbiter } = await deploy();

    // amounts are the NET values that go into the escrow
    const amounts    = [parseEther("0.5"), parseEther("0.5")];
    const netTotal   = amounts.reduce((a, b) => a + b, 0n);

    // gross = netTotal + fee; use quoteMilestone to get correct gross
    const [gross] = await factory.read.quoteMilestone([netTotal, false]);

    await factory.write.createMilestoneEscrow(
      [
        getAddress(beneficiary.account.address),
        getAddress(arbiter.account.address),
        ["Phase 1", "Phase 2"],
        amounts,
        1,     // Enhanced tier
        false,
      ],
      { value: gross }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);

    const record = await factory.read.escrows([0n]);
    assert.equal(record[1], 1);  // EscrowType.MILESTONE
    assert.equal(record[7], 1);  // trustTier = Enhanced
  });

  // ─── Indexing ──────────────────────────────────────────────────────────────

  it("indexes escrows by depositor", async () => {
    const { factory, beneficiary, arbiter, owner } = await deploy();
    const [total] = await factory.read.quoteSimple([parseEther("0.5"), false]);

    for (let i = 0; i < 2; i++) {
      await factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false],
        { value: total }
      );
    }

    const indices = await factory.read.getEscrowsByDepositor([getAddress(owner.account.address)]);
    assert.equal(indices.length, 2);
  });

  it("returns paginated escrows", async () => {
    const { factory, beneficiary, arbiter } = await deploy();
    const [total] = await factory.read.quoteSimple([parseEther("0.1"), false]);

    for (let i = 0; i < 3; i++) {
      await factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false],
        { value: total }
      );
    }

    const page  = await factory.read.getEscrows([0n, 2n]);
    assert.equal(page.length, 2);

    const page2 = await factory.read.getEscrows([2n, 2n]);
    assert.equal(page2.length, 1);
  });

  // ─── Fee withdrawal ────────────────────────────────────────────────────────

  it("owner can withdraw accumulated fees", async () => {
    const { factory, beneficiary, arbiter, owner, conn } = await deploy();
    const publicClient = await conn.viem.getPublicClient();

    const [total] = await factory.read.quoteSimple([parseEther("1.0"), false]);
    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false],
      { value: total }
    );

    const balanceBefore = await publicClient.getBalance({ address: owner.account.address });
    await factory.write.withdrawFees();
    const balanceAfter = await publicClient.getBalance({ address: owner.account.address });

    assert.ok(balanceAfter > balanceBefore, "Owner should receive fees");

    const accumulated = await factory.read.accumulatedFees();
    assert.equal(accumulated, 0n);
  });
});
