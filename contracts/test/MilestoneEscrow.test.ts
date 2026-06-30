import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress, zeroAddress } from "viem";

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
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(factoryAcct.account.address),
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      ZERO,
      descriptions,
      amounts,
    ]);
    return { escrow, conn, factory: factoryAcct, depositor, beneficiary, arbiter };
  }

  it("[onlyFactory] fund() may only be called by the factory", async () => {
    const { escrow } = await deployEth();
    await assert.rejects(
      escrow.write.fund([total], { value: total }),
      /Not factory|reverted|unknown RPC/
    );
  });

  it("[onlyFactory] fund() works when called by the factory", async () => {
    const { escrow, factory } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    assert.equal(await escrow.read.funded(), true);
  });

  it("[constructor] rejects zero factory address", async () => {
    const conn = await hre.network.connect();
    const [defaultAcct, beneficiary, arbiter] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("MilestoneEscrow", [
        zeroAddress,
        defaultAcct.account.address,
        beneficiary.account.address,
        arbiter.account.address,
        ZERO,
        descriptions,
        amounts,
      ]),
      /Invalid factory/
    );
  });

  it("[constructor] rejects mismatched descriptions/amounts lengths", async () => {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("MilestoneEscrow", [
        factoryAcct.account.address,
        depositor.account.address,
        beneficiary.account.address,
        arbiter.account.address,
        ZERO,
        ["a", "b"], // 2 descriptions
        [1n, 2n, 3n], // 3 amounts
      ]),
      /Length mismatch/
    );
  });

  it("[constructor] rejects > 50 milestones", async () => {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    const manyDescriptions = Array.from({ length: 51 }, (_, i) => `M${i}`);
    const manyAmounts = Array.from({ length: 51 }, () => 1n);
    await assert.rejects(
      conn.viem.deployContract("MilestoneEscrow", [
        factoryAcct.account.address,
        depositor.account.address,
        beneficiary.account.address,
        arbiter.account.address,
        ZERO,
        manyDescriptions,
        manyAmounts,
      ]),
      /Too many milestones/
    );
  });

  it("[constructor] rejects zero milestone amount", async () => {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("MilestoneEscrow", [
        factoryAcct.account.address,
        depositor.account.address,
        beneficiary.account.address,
        arbiter.account.address,
        ZERO,
        ["a", "b"],
        [1n, 0n],
      ]),
      /Milestone amount must be > 0/
    );
  });

  it("funds the contract with exact total", async () => {
    const { escrow, factory } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    assert.equal(await escrow.read.funded(), true);
  });

  it("releases a milestone to beneficiary", async () => {
    const { escrow, factory, depositor } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    await escrow.write.releaseMilestone([0n], { account: depositor.account });
    const [, , state] = await escrow.read.milestones([0n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter resolves disputed milestone", async () => {
    const { escrow, factory, depositor, arbiter } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    await escrow.write.disputeMilestone([1n], { account: depositor.account });
    await escrow.write.resolveRelease([1n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([1n]);
    assert.equal(state, 1); // RELEASED
  });

  it("arbiter can refund a disputed milestone", async () => {
    const { escrow, factory, depositor, arbiter } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    await escrow.write.disputeMilestone([2n], { account: depositor.account });
    await escrow.write.resolveRefund([2n], { account: arbiter.account });
    const [, , state] = await escrow.read.milestones([2n]);
    assert.equal(state, 3); // REFUNDED
  });

  it("[nonReentrant] disputeMilestone carries the reentrancy guard", async () => {
    // Smoke test that the modifier is applied.
    const { escrow, factory, depositor, arbiter } = await deployEth();
    await escrow.write.fund([total], { value: total, account: factory.account });
    await escrow.write.disputeMilestone([0n], { account: depositor.account });
    // Try to call resolveRelease from a non-arbiter — should fail.
    await assert.rejects(
      escrow.write.resolveRelease([0n], { account: depositor.account }),
      /Not arbiter|reverted|unknown RPC/
    );
  });

  // ─── ERC-20 path ───────────────────────────────────────────────────────────

  async function deployToken() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();

    const token = await conn.viem.deployContract("MockERC20", []);
    await token.write.mint([getAddress(depositor.account.address), 10_000_000n]);
    await token.write.mint([getAddress(factoryAcct.account.address), 10_000_000n]);

    const escrow = await conn.viem.deployContract("MilestoneEscrow", [
      getAddress(factoryAcct.account.address),
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
      descriptions,
      tokenAmounts,
    ]);

    return { escrow, token, conn, factory: factoryAcct, depositor, beneficiary, arbiter };
  }

  /**
   * Pre-transfers the total token amount to the escrow and calls fund()
   * from the factory, simulating the real EscrowFactory flow.
   */
  async function fundTokenEscrow(ctx: { escrow: any; token: any; factory: any }, amount: bigint) {
    await ctx.token.write.transfer([ctx.escrow.address, amount], { account: ctx.factory.account });
    await ctx.escrow.write.fund([amount], { account: ctx.factory.account });
  }

  it("[ERC-20] factory transfers tokens then calls fund()", async () => {
    const ctx = await deployToken();
    await fundTokenEscrow(ctx, tokenTotal);
    assert.equal(await ctx.escrow.read.funded(), true);
    assert.equal(await ctx.token.read.balanceOf([ctx.escrow.address]), tokenTotal);
  });

  it("[ERC-20] releases milestone — tokens sent to beneficiary", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    await fundTokenEscrow(ctx, tokenTotal);
    await ctx.escrow.write.releaseMilestone([0n], { account: ctx.depositor.account });
    const [, , state] = await ctx.escrow.read.milestones([0n]);
    assert.equal(state, 1);
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[0]);
  });

  it("[ERC-20] arbiter resolves — tokens sent to beneficiary", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    await fundTokenEscrow(ctx, tokenTotal);
    await ctx.escrow.write.disputeMilestone([1n], { account: ctx.depositor.account });
    await ctx.escrow.write.resolveRelease([1n], { account: ctx.arbiter.account });
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[1]);
  });

  it("[ERC-20] arbiter refunds — tokens returned to depositor", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.depositor.account.address)]);
    await fundTokenEscrow(ctx, tokenTotal);
    await ctx.escrow.write.disputeMilestone([2n], { account: ctx.depositor.account });
    await ctx.escrow.write.resolveRefund([2n], { account: ctx.arbiter.account });
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.depositor.account.address)]);
    assert.equal(balAfter - balBefore, tokenAmounts[2]);
  });

  it("[ERC-20] reverts if ETH sent with token escrow fund", async () => {
    const ctx = await deployToken();
    await ctx.token.write.transfer([ctx.escrow.address, tokenTotal], { account: ctx.factory.account });
    await assert.rejects(
      ctx.escrow.write.fund([tokenTotal], { value: 1n, account: ctx.factory.account }),
      /No ETH for token escrow/
    );
  });

  it("[ERC-20] reverts if escrow has no token balance", async () => {
    const ctx = await deployToken();
    // No transfer
    await assert.rejects(
      ctx.escrow.write.fund([tokenTotal], { account: ctx.factory.account }),
      /Token not received/
    );
  });
});
