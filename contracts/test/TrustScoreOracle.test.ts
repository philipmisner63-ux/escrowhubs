import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { getAddress, zeroAddress } from "viem";

describe("TrustScoreOracle", () => {
  async function deploy(initialOwner?: `0x${string}`) {
    const conn = await hre.network.connect();
    const [defaultAcct, wallet1, wallet2] = await conn.viem.getWalletClients();
    const ownerAddr = initialOwner ?? defaultAcct.account.address;
    const oracle = await conn.viem.deployContract("TrustScoreOracle", [ownerAddr]);
    return { oracle, owner: defaultAcct, ownerAddr, wallet1, wallet2 };
  }

  it("defaults to score 0 / tier 0 for unknown wallet", async () => {
    const { oracle, wallet1 } = await deploy();
    const tier = await oracle.read.getTier([getAddress(wallet1.account.address)]);
    assert.equal(tier, 0);
  });

  it("sets score and returns correct tier", async () => {
    const { oracle, wallet1 } = await deploy();

    await oracle.write.setScore([getAddress(wallet1.account.address), 85]);
    const tier = await oracle.read.getTier([getAddress(wallet1.account.address)]);
    assert.equal(tier, 2); // Full

    await oracle.write.setScore([getAddress(wallet1.account.address), 65]);
    const tier2 = await oracle.read.getTier([getAddress(wallet1.account.address)]);
    assert.equal(tier2, 1); // Enhanced

    await oracle.write.setScore([getAddress(wallet1.account.address), 30]);
    const tier3 = await oracle.read.getTier([getAddress(wallet1.account.address)]);
    assert.equal(tier3, 0); // Standard
  });

  it("sets scores in batch", async () => {
    const { oracle, wallet1, wallet2 } = await deploy();

    await oracle.write.setScoreBatch(
      [[getAddress(wallet1.account.address), getAddress(wallet2.account.address)], [90, 55]]
    );

    const [s1] = await oracle.read.getScoreAndTier([getAddress(wallet1.account.address)]);
    const [s2] = await oracle.read.getScoreAndTier([getAddress(wallet2.account.address)]);
    assert.equal(s1, 90);
    assert.equal(s2, 55);
  });

  it("updates thresholds", async () => {
    const { oracle, wallet1 } = await deploy();

    await oracle.write.setThresholds([60, 90]);
    await oracle.write.setScore([getAddress(wallet1.account.address), 80]);

    // Score 80 is now Enhanced (between 60 and 90), not Full
    const tier = await oracle.read.getTier([getAddress(wallet1.account.address)]);
    assert.equal(tier, 1);
  });

  // ─── GATE 1 fixes (Fusion audit 2026-06-16) ───────────────────────────────

  it("[Ownable2Step] constructor requires non-zero initial owner", async () => {
    const conn = await hre.network.connect();
    await assert.rejects(
      conn.viem.deployContract("TrustScoreOracle", [zeroAddress]),
      /OwnableInvalidOwner|Invalid initial owner/
    );
  });

  it("[Ownable2Step] sets initial owner from constructor param (no longer msg.sender)", async () => {
    const conn = await hre.network.connect();
    const [defaultAcct, other] = await conn.viem.getWalletClients();
    // Deploy with `other` as the initial owner.
    const oracle = await conn.viem.deployContract("TrustScoreOracle", [other.account.address]);
    // The default account should NOT be the owner.
    await assert.rejects(
      oracle.write.setScore([defaultAcct.account.address, 50], { account: defaultAcct.account }),
      /Ownable|onlyOwner/i
    );
    // `other` IS the owner and can set scores.
    await oracle.write.setScore([defaultAcct.account.address, 50], { account: other.account });
    const tier = await oracle.read.getTier([defaultAcct.account.address]);
    assert.equal(tier, 1);
  });

  it("[Ownable2Step] transferOwnership is two-step (must acceptOwnership)", async () => {
    const { oracle, owner, wallet1 } = await deploy();
    // Initiate transfer
    await oracle.write.transferOwnership([wallet1.account.address], { account: owner.account });
    // Old owner can still write during pending
    await oracle.write.setScore([wallet1.account.address, 10], { account: owner.account });
    // Pending owner hasn't accepted yet, so they can't write
    await assert.rejects(
      oracle.write.setScore([wallet1.account.address, 20], { account: wallet1.account }),
      /Ownable|onlyOwner/i
    );
    // Accept
    await oracle.write.acceptOwnership({ account: wallet1.account });
    // New owner can now write
    await oracle.write.setScore([wallet1.account.address, 20], { account: wallet1.account });
    const tier = await oracle.read.getTier([wallet1.account.address]);
    assert.equal(tier, 0);
  });

  it("[threshold cap] setThresholds rejects tier1 > 100 (was previously exploitable)", async () => {
    const { oracle } = await deploy();
    await assert.rejects(
      oracle.write.setThresholds([101, 102]),
      /tier1 out of/
    );
  });

  it("[threshold cap] setThresholds rejects tier2 > 100", async () => {
    const { oracle } = await deploy();
    await assert.rejects(
      oracle.write.setThresholds([50, 101]),
      /tier2 out of/
    );
  });

  it("[threshold cap] setThresholds rejects tier1 == 0 (would promote everyone to Tier 1)", async () => {
    const { oracle, wallet1 } = await deploy();
    await assert.rejects(
      oracle.write.setThresholds([0, 100]),
      /tier1 out of/
    );
  });

  it("[threshold cap] tier boundary values (1, 100) are accepted", async () => {
    const { oracle } = await deploy();
    await oracle.write.setThresholds([1, 100]);
    const t1 = await oracle.read.tier1Threshold();
    const t2 = await oracle.read.tier2Threshold();
    assert.equal(t1, 1);
    assert.equal(t2, 100);
  });

  it("[setScore] rejects address(0) wallet", async () => {
    const { oracle } = await deploy();
    await assert.rejects(
      oracle.write.setScore([zeroAddress, 50]),
      /Invalid wallet/
    );
  });

  it("[setScoreBatch] rejects batch > 200", async () => {
    const { oracle } = await deploy();
    const wallets = Array.from({ length: 201 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, "0")}` as `0x${string}`);
    const scores  = Array.from({ length: 201 }, () => 50);
    await assert.rejects(
      oracle.write.setScoreBatch([wallets, scores]),
      /Batch too large/
    );
  });

  it("[setScoreBatch] rejects zero-address in batch", async () => {
    const { oracle, wallet1 } = await deploy();
    await assert.rejects(
      oracle.write.setScoreBatch([[zeroAddress, wallet1.account.address], [50, 60]]),
      /Invalid wallet/
    );
  });
});
