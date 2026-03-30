import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { getAddress } from "viem";

describe("TrustScoreOracle", () => {
  async function deploy() {
    const conn = await hre.network.connect();
    const [owner, wallet1, wallet2] = await conn.viem.getWalletClients();
    const oracle = await conn.viem.deployContract("TrustScoreOracle", []);
    return { oracle, owner, wallet1, wallet2 };
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
});
