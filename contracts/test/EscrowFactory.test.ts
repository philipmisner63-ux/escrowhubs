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
// 10: referrer
// 11: token

const ZERO = "0x0000000000000000000000000000000000000000" as const;

describe("EscrowFactory", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [owner, beneficiary, arbiter, other] = await conn.viem.getWalletClients();

    const factory   = await conn.viem.deployContract("EscrowFactory", []);
    const aiArbiter = await conn.viem.deployContract("AIArbiter", [owner.account.address]);

    await factory.write.setAIArbiter([aiArbiter.address]);

    return { factory, aiArbiter, conn, owner, beneficiary, arbiter, other };
  }

  async function deployWithToken() {
    const base = await deploy();
    const conn = base.conn;
    const [owner] = await conn.viem.getWalletClients();
    const token = await conn.viem.deployContract("MockERC20", []);
    // Mint 10M mUSDC to owner (depositor in tests)
    await token.write.mint([getAddress(owner.account.address), 10_000_000n]);
    return { ...base, token };
  }

  // ─── ETH: SimpleEscrow ─────────────────────────────────────────────────────

  it("creates a SimpleEscrow and records it", async () => {
    const { factory, beneficiary, arbiter } = await deploy();
    const [total] = await factory.read.quoteSimple([parseEther("1.0"), false]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false, ZERO, ZERO],
      { value: total }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);
    const record = await factory.read.escrows([0n]);
    assert.equal(record[3].toLowerCase(), beneficiary.account.address.toLowerCase());
    assert.equal(record[7], 0);
    assert.equal(record[8], false);
    assert.equal(record[11].toLowerCase(), ZERO); // token = ETH
  });

  it("takes a protocol fee on SimpleEscrow creation", async () => {
    const { factory, beneficiary, arbiter, conn } = await deploy();
    const publicClient = await conn.viem.getPublicClient();
    const [total, fee] = await factory.read.quoteSimple([parseEther("1.0"), false]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false, ZERO, ZERO],
      { value: total }
    );

    assert.ok(fee > 0n);
    const accumulated = await factory.read.accumulatedFees();
    assert.ok(accumulated >= fee - 1n && accumulated <= fee + 1n);
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
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, true, ZERO, ZERO],
      { value: total }
    );

    const record = await factory.read.escrows([0n]);
    assert.equal(record[4].toLowerCase(), aiArbiter.address.toLowerCase());
    assert.equal(record[8], true);
  });

  // ─── ETH: MilestoneEscrow ──────────────────────────────────────────────────

  it("creates a MilestoneEscrow and records it", async () => {
    const { factory, beneficiary, arbiter } = await deploy();
    const amounts  = [parseEther("0.5"), parseEther("0.5")];
    const netTotal = amounts.reduce((a, b) => a + b, 0n);
    const [gross]  = await factory.read.quoteMilestone([netTotal, false]);

    await factory.write.createMilestoneEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       ["Phase 1", "Phase 2"], amounts, 1, false, ZERO, ZERO],
      { value: gross }
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);
    const record = await factory.read.escrows([0n]);
    assert.equal(record[1], 1);  // MILESTONE
    assert.equal(record[7], 1);  // Enhanced tier
    assert.equal(record[11].toLowerCase(), ZERO);
  });

  // ─── ETH: Indexing + fees ──────────────────────────────────────────────────

  it("indexes escrows by depositor", async () => {
    const { factory, beneficiary, arbiter, owner } = await deploy();
    const [total] = await factory.read.quoteSimple([parseEther("0.5"), false]);
    for (let i = 0; i < 2; i++) {
      await factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false, ZERO, ZERO],
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
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false, ZERO, ZERO],
        { value: total }
      );
    }
    assert.equal((await factory.read.getEscrows([0n, 2n])).length, 2);
    assert.equal((await factory.read.getEscrows([2n, 2n])).length, 1);
  });

  it("owner can withdraw accumulated fees", async () => {
    const { factory, beneficiary, arbiter, owner, conn } = await deploy();
    const publicClient = await conn.viem.getPublicClient();
    const [total] = await factory.read.quoteSimple([parseEther("1.0"), false]);
    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address), 0, false, ZERO, ZERO],
      { value: total }
    );
    const balBefore = await publicClient.getBalance({ address: owner.account.address });
    await factory.write.withdrawFees();
    const balAfter = await publicClient.getBalance({ address: owner.account.address });
    assert.ok(balAfter > balBefore);
    assert.equal(await factory.read.accumulatedFees(), 0n);
  });

  // ─── ERC-20: SimpleEscrow ──────────────────────────────────────────────────

  it("[ERC-20] creates a SimpleEscrow with tokens and records it", async () => {
    const { factory, beneficiary, arbiter, token, owner } = await deployWithToken();

    const gross = 1_010_000n; // 1.01 mUSDC — slightly above 1M to cover 0.5% fee
    await token.write.approve([factory.address, gross]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       0, false, token.address, ZERO]
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);
    const record = await factory.read.escrows([0n]);
    assert.equal(record[11].toLowerCase(), token.address.toLowerCase()); // token address recorded
    assert.ok(record[5] > 0n); // totalAmount > 0
  });

  it("[ERC-20] protocol fee taken in tokens (and routed to per-token pool, not ETH pool)", async () => {
    const { factory, beneficiary, arbiter, token } = await deployWithToken();

    const gross = 1_010_000n;
    await token.write.approve([factory.address, gross]);
    const balBefore = await token.read.balanceOf([factory.address]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       0, false, token.address, ZERO]
    );

    // Per-token fee pool should hold the protocol fee, NOT the ETH pool.
    // This is the fix for the cross-asset accounting mismatch: token fees
    // were previously mis-credited to accumulatedFees (which can only pay ETH).
    const ethPool     = await factory.read.accumulatedFees();
    const tokenPool   = await factory.read.accumulatedTokenFees([token.address]);
    assert.equal(ethPool, 0n, "ETH pool should be empty for an ERC-20 escrow");
    assert.ok(tokenPool > 0n, "Per-token pool should hold the ERC-20 fee");

    // Escrow should hold net tokens (gross - fee)
    const record = await factory.read.escrows([0n]);
    const escrowBal = await token.read.balanceOf([record[0]]);
    assert.equal(escrowBal, record[5]); // escrow holds totalAmount
  });

  it("[ERC-20] owner can withdraw accumulated token fees via withdrawTokenFees(token)", async () => {
    const { factory, beneficiary, arbiter, token, owner, conn } = await deployWithToken();
    const publicClient = await conn.viem.getPublicClient();

    const gross = 1_010_000n;
    await token.write.approve([factory.address, gross]);
    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       0, false, token.address, ZERO]
    );

    const tokenPoolBefore = await factory.read.accumulatedTokenFees([token.address]);
    assert.ok(tokenPoolBefore > 0n);

    // Withdraw as the owner; treasury defaults to owner.
    await factory.write.withdrawTokenFees([token.address]);

    assert.equal(await factory.read.accumulatedTokenFees([token.address]), 0n);
    // Owner's token balance should have increased by the fee amount.
    const ownerBal = await token.read.balanceOf([getAddress(owner.account.address)]);
    assert.ok(ownerBal >= tokenPoolBefore);
  });

  it("[ERC-20] withdrawTokenFees rejects address(0) to avoid silent ETH loss", async () => {
    const { factory } = await deploy();
    await assert.rejects(
      factory.write.withdrawTokenFees(["0x0000000000000000000000000000000000000000"]),
      /Use withdrawFees\(\) for ETH/
    );
  });

  it("[ERC-20] withdrawTokenFees reverts if not owner", async () => {
    const { factory, beneficiary, arbiter, token, other } = await deployWithToken();
    const gross = 1_010_000n;
    await token.write.approve([factory.address, gross]);
    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       0, false, token.address, ZERO]
    );
    await assert.rejects(
      factory.write.withdrawTokenFees([token.address], { account: other.account }),
      /Not owner|Ownable/i
    );
  });

  it("[ERC-20] reject length mismatch on milestone escrow", async () => {
    const { factory, beneficiary, arbiter, token } = await deployWithToken();
    await token.write.approve([factory.address, 1_010_000n]);
    await assert.rejects(
      factory.write.createMilestoneEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
         ["M1", "M2"], [300_000n, 400_000n, 300_000n], 0, false, token.address, ZERO]
      ),
      /Length mismatch/
    );
  });

  it("[ERC-20] reverts if ETH sent with token escrow", async () => {
    const { factory, beneficiary, arbiter, token } = await deployWithToken();
    await token.write.approve([factory.address, 1_010_000n]);
    await assert.rejects(
      factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
         0, false, token.address, ZERO],
        { value: 1n }
      ),
      /Do not send ETH/
    );
  });

  it("[ERC-20] reverts if no token allowance", async () => {
    const { factory, beneficiary, arbiter, token } = await deployWithToken();
    // No approve call — should revert
    await assert.rejects(
      factory.write.createSimpleEscrow(
        [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
         0, false, token.address, ZERO]
      ),
      /No token allowance/
    );
  });

  // ─── ERC-20: MilestoneEscrow ───────────────────────────────────────────────

  it("[ERC-20] creates a MilestoneEscrow with tokens", async () => {
    const { factory, beneficiary, arbiter, token } = await deployWithToken();

    const milestoneAmounts = [300_000n, 400_000n, 300_000n]; // 1M total
    const netTotal = milestoneAmounts.reduce((a, b) => a + b, 0n);
    const gross = 1_010_000n; // covers fee
    await token.write.approve([factory.address, gross]);

    await factory.write.createMilestoneEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       ["M1", "M2", "M3"], milestoneAmounts, 0, false, token.address, ZERO]
    );

    const count = await factory.read.escrowCount();
    assert.equal(count, 1n);
    const record = await factory.read.escrows([0n]);
    assert.equal(record[1], 1); // MILESTONE
    assert.equal(record[11].toLowerCase(), token.address.toLowerCase());
    // Escrow should hold the net milestone total
    const escrowBal = await token.read.balanceOf([record[0]]);
    assert.equal(escrowBal, netTotal);
  });

  // ─── Referral with ERC-20 ──────────────────────────────────────────────────

  it("[ERC-20] referral credited in tokens (claimable via claimReferralEarnings(token))", async () => {
    const { factory, beneficiary, arbiter, token, other } = await deployWithToken();

    const gross = 1_010_000n;
    await token.write.approve([factory.address, gross]);

    await factory.write.createSimpleEscrow(
      [getAddress(beneficiary.account.address), getAddress(arbiter.account.address),
       0, false, token.address, getAddress(other.account.address)] // other is referrer
    );

    // Per-token earnings, claimable via the token overload.
    const tokenEarnings = await factory.read.getTokenReferralEarnings([
      getAddress(other.account.address), token.address
    ]);
    assert.ok(tokenEarnings > 0n, "Referrer should have claimable token earnings");

    // ETH earnings slot should be empty (cross-asset isolation).
    const ethStats = await factory.read.getReferralStats([getAddress(other.account.address)]);
    assert.equal(ethStats[3], 0n, "ETH earnings slot should be empty for a token escrow");

    // Claim the token earnings.
    const balBefore = await token.read.balanceOf([getAddress(other.account.address)]);
    await factory.write.claimReferralEarnings([token.address], { account: other.account });
    const balAfter = await token.read.balanceOf([getAddress(other.account.address)]);

    assert.equal(
      await factory.read.getTokenReferralEarnings([getAddress(other.account.address), token.address]),
      0n,
      "Token earnings should be zeroed after claim"
    );
    assert.equal(balAfter - balBefore, tokenEarnings, "Referrer should receive the kickback in tokens");
  });

  it("[ERC-20] claimReferralEarnings(address(0)) reverts to avoid silent loss", async () => {
    const { factory, other } = await deploy();
    await assert.rejects(
      factory.write.claimReferralEarnings(["0x0000000000000000000000000000000000000000"],
        { account: other.account }),
      /Use claimReferralEarnings\(\) for ETH/
    );
  });
});
