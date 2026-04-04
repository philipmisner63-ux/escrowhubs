import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const descriptions = ["Kickoff", "Delivery", "Final"];
const amounts      = [parseEther("0.1"), parseEther("0.5"), parseEther("0.4")];
const total        = amounts.reduce((a, b) => a + b, 0n);

// Token amounts: 100, 500, 400 mUSDC (6 decimals)
const tokenAmounts = [100_000n, 500_000n, 400_000n];
const tokenTotal   = tokenAmounts.reduce((a, b) => a + b, 0n);

describe("MilestoneEscrow", () => {

  // ─── ETH path ──────────────────────────────────────────────────────────────

  async function deployEth() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      ZERO,
      descriptions,
      amounts,
    ]);
    return { escrow, conn, depositor, beneficiary, arbiter };
  }

  it("funds the contract with exact total", async () => {
    const { escrow } = await deployEth();
    await escrow.write.fund([total], { value: total });
    assert.equal(await escrow.read.funded(), true);
  });

  it("releases a milestone to beneficiary", async () => {
    const { escrow } = await deployEth();
    await escrow.write.fund([total], { value: total });
    await escrow.write.releaseMilestone([0n]);
    const [, , state] = await escrow.read.milestones([0n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter resolves disputed milestone", async () => {
    const { escrow, arbiter } = await deployEth();
    await escrow.write.fund([total], { value: total });
    await escrow.write.disputeMilestone([1n]);
    await escrow.write.resolveRelease([1n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([1n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter can refund a disputed milestone", async () => {
    const { escrow, arbiter } = await deployEth();
    await escrow.write.fund([total], { value: total });
    await escrow.write.disputeMilestone([2n]);
    await escrow.write.resolveRefund([2n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([2n]);
    assert.equal(state, 3); // REFUNDED
  });

  // ─── ERC-20 path ───────────────────────────────────────────────────────────

  async function deployToken() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();

    const token = await conn.viem.deployContract("MockERC20", []);
    await token.write.mint([getAddress(depositor.account.address), 10_000_000n]);

    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
      descriptions,
      tokenAmounts,
    ]);

    // Factory would do this — transfer tokens to escrow first
    await token.write.transfer([escrow.address, tokenTotal]);

    return { escrow, token, conn, depositor, beneficiary, arbiter };
  }

  it("[ERC-20] funds with tokens", async () => {
    const { escrow, token } = await deployToken();
    await escrow.write.fund([tokenTotal]);
    assert.equal(await escrow.read.funded(), true);
    assert.equal(await token.read.balanceOf([escrow.address]), tokenTotal);
  });

  it("[ERC-20] releases milestone — tokens sent to beneficiary", async () => {
    const { escrow, token, beneficiary } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    await escrow.write.fund([tokenTotal]);
    await escrow.write.releaseMilestone([0n]);
    const [, , state] = await escrow.read.milestones([0n]);
    assert.equal(state, 1);
    const balAfter = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[0]);
  });

  it("[ERC-20] arbiter resolves — tokens sent to beneficiary", async () => {
    const { escrow, token, beneficiary, arbiter } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    await escrow.write.fund([tokenTotal]);
    await escrow.write.disputeMilestone([1n]);
    await escrow.write.resolveRelease([1n], { account: arbiter.account });
    const balAfter = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[1]);
  });

  it("[ERC-20] arbiter refunds — tokens returned to depositor", async () => {
    const { escrow, token, depositor, arbiter } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(depositor.account.address)]);
    await escrow.write.fund([tokenTotal]);
    await escrow.write.disputeMilestone([2n]);
    await escrow.write.resolveRefund([2n], { account: arbiter.account });
    const balAfter = await token.read.balanceOf([getAddress(depositor.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[2]);
  });

  it("[ERC-20] reverts if ETH sent with token escrow fund", async () => {
    const { escrow } = await deployToken();
    await assert.rejects(
      escrow.write.fund([tokenTotal], { value: 1n })
    );
  });

  it("[ERC-20] reverts if token balance insufficient for fund", async () => {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const token = await conn.viem.deployContract("MockERC20", []);
    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
      descriptions,
      tokenAmounts,
    ]);
    // No tokens sent to escrow
    await assert.rejects(
      escrow.write.fund([tokenTotal]),
      /Token not received/
    );
  });
});
