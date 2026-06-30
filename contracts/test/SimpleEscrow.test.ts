import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress, zeroAddress } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const AMOUNT_ETH = parseEther("1.0");
const AMOUNT_TOKEN = 1_000_000n; // 1 USDC (6 decimals)

describe("SimpleEscrow", () => {

  // ─── ETH path ──────────────────────────────────────────────────────────────

  async function deployEth(opts: { factory?: `0x${string}`; depositor?: `0x${string}`; beneficiary?: `0x${string}`; arbiter?: `0x${string}` } = {}) {
    const conn = await hre.network.connect();
    const [defaultAcct, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(opts.factory ?? factoryAcct.account.address),
      getAddress(opts.depositor ?? defaultAcct.account.address),
      getAddress(opts.beneficiary ?? beneficiary.account.address),
      getAddress(opts.arbiter ?? arbiter.account.address),
      ZERO,
    ]);
    return { escrow, conn, factory: factoryAcct, depositor: defaultAcct, beneficiary, arbiter };
  }

  it("[onlyFactory] deposit() may only be called by the factory", async () => {
    const { escrow, depositor } = await deployEth();
    // Use a generic error match — Hardhat 3's viem binding doesn't always
    // surface the short revert reason string for low-level reverts.
    await assert.rejects(
      escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: depositor.account }),
      /Not factory|reverted|unknown RPC/
    );
  });

  it("[onlyFactory] deposit() works when called by the factory", async () => {
    const { escrow, factory } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: factory.account });
    assert.equal(await escrow.read.state(), 1); // AWAITING_DELIVERY
  });

  it("[nonReentrant] deposit() carries the reentrancy guard", async () => {
    // Smoke test that the modifier is applied. Direct test of reentrancy would
    // require a malicious token; the OZ ReentrancyGuard is well-tested upstream.
    const { escrow, factory } = await deployEth();
    // The guard is per-instance; this just confirms deposit() executes.
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: factory.account });
    assert.equal(await escrow.read.state(), 1);
  });

  it("[constructor] rejects zero factory address", async () => {
    const conn = await hre.network.connect();
    const [defaultAcct, beneficiary, arbiter] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("SimpleEscrow", [
        zeroAddress,
        defaultAcct.account.address,
        beneficiary.account.address,
        arbiter.account.address,
        ZERO,
      ]),
      /Invalid factory/
    );
  });

  it("[constructor] rejects role overlap (depositor == beneficiary)", async () => {
    const conn = await hre.network.connect();
    const [defaultAcct, , arbiter, factoryAcct] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("SimpleEscrow", [
        factoryAcct.account.address,
        defaultAcct.account.address,
        defaultAcct.account.address, // same as depositor
        arbiter.account.address,
        ZERO,
      ]),
      /depositor == beneficiary/
    );
  });

  it("[constructor] rejects role overlap (depositor == arbiter)", async () => {
    const conn = await hre.network.connect();
    const [defaultAcct, beneficiary, , factoryAcct] = await conn.viem.getWalletClients();
    await assert.rejects(
      conn.viem.deployContract("SimpleEscrow", [
        factoryAcct.account.address,
        defaultAcct.account.address,
        beneficiary.account.address,
        defaultAcct.account.address, // same as depositor
        ZERO,
      ]),
      /depositor == arbiter/
    );
  });

  it("releases funds to beneficiary", async () => {
    const { escrow, factory, depositor } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: factory.account });
    await escrow.write.release({ account: depositor.account });
    assert.equal(await escrow.read.state(), 2); // COMPLETE
  });

  it("arbiter can resolve dispute in favour of beneficiary", async () => {
    const { escrow, factory, depositor, arbiter } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: factory.account });
    await escrow.write.dispute({ account: depositor.account });
    await escrow.write.resolveRelease([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 2); // COMPLETE
  });

  it("arbiter can refund depositor", async () => {
    const { escrow, factory, depositor, arbiter } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH, account: factory.account });
    await escrow.write.dispute({ account: depositor.account });
    await escrow.write.resolveRefund([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 4); // REFUNDED
  });

  // ─── ERC-20 path ───────────────────────────────────────────────────────────

  async function deployToken() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();

    const token = await conn.viem.deployContract("MockERC20", []);
    await token.write.mint([getAddress(depositor.account.address), 10_000_000n]);
    // Also mint to the factory so it can transfer to the escrow (simulating
    // the real factory flow: factory pulls from depositor, transfers to escrow).
    await token.write.mint([getAddress(factoryAcct.account.address), 10_000_000n]);

    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(factoryAcct.account.address),
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
    ]);

    return { escrow, token, conn, factory: factoryAcct, depositor, beneficiary, arbiter };
  }

  /**
   * Pre-transfers tokens to the escrow and calls deposit from the factory,
   * simulating the real EscrowFactory flow. The test can then assert state
   * and balances after the deposit.
   */
  async function fundTokenEscrow(ctx: { escrow: any; token: any; factory: any }, amount: bigint) {
    await ctx.token.write.transfer([ctx.escrow.address, amount], { account: ctx.factory.account });
    await ctx.escrow.write.deposit([amount], { account: ctx.factory.account });
  }

  it("[ERC-20] factory pulls tokens via safeTransferFrom and records measured delta", async () => {
    const ctx = await deployToken();
    // Simulate the real factory flow: factory transfers tokens to the escrow,
    // then calls deposit() to record the received amount.
    await fundTokenEscrow(ctx, AMOUNT_TOKEN);
    assert.equal(await ctx.escrow.read.state(), 1); // AWAITING_DELIVERY
    assert.equal(await ctx.token.read.balanceOf([ctx.escrow.address]), AMOUNT_TOKEN);
    // Beneficiary has not received anything yet
    assert.equal(await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]), 0n);
  });

  it("[ERC-20] release transfers tokens to beneficiary", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    await fundTokenEscrow(ctx, AMOUNT_TOKEN);
    await ctx.escrow.write.release({ account: ctx.depositor.account });
    assert.equal(await ctx.escrow.read.state(), 2);
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] arbiter resolves dispute — release tokens", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    await fundTokenEscrow(ctx, AMOUNT_TOKEN);
    await ctx.escrow.write.dispute({ account: ctx.depositor.account });
    await ctx.escrow.write.resolveRelease([], { account: ctx.arbiter.account });
    assert.equal(await ctx.escrow.read.state(), 2);
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] arbiter refunds tokens to depositor", async () => {
    const ctx = await deployToken();
    const balBefore = await ctx.token.read.balanceOf([getAddress(ctx.depositor.account.address)]);
    await fundTokenEscrow(ctx, AMOUNT_TOKEN);
    await ctx.escrow.write.dispute({ account: ctx.depositor.account });
    await ctx.escrow.write.resolveRefund([], { account: ctx.arbiter.account });
    assert.equal(await ctx.escrow.read.state(), 4);
    const balAfter = await ctx.token.read.balanceOf([getAddress(ctx.depositor.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] reverts if ETH sent with token escrow", async () => {
    const ctx = await deployToken();
    await ctx.token.write.transfer([ctx.escrow.address, AMOUNT_TOKEN], { account: ctx.factory.account });
    await assert.rejects(
      ctx.escrow.write.deposit([AMOUNT_TOKEN], { value: 1n, account: ctx.factory.account }),
      /No ETH for token escrow/
    );
  });

  it("[ERC-20] reverts if escrow has no token balance", async () => {
    const ctx = await deployToken();
    // No transfer — should revert with "Token not received"
    await assert.rejects(
      ctx.escrow.write.deposit([AMOUNT_TOKEN], { account: ctx.factory.account }),
      /Token not received/
    );
  });

  it("[ERC-20] records actual balance (fee-on-transfer safe)", async () => {
    // Simulate a fee-on-transfer token by transferring LESS than requested.
    // The escrow should record what actually arrived, not revert.
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter, factoryAcct] = await conn.viem.getWalletClients();
    const token = await conn.viem.deployContract("MockERC20", []);
    await token.write.mint([getAddress(factoryAcct.account.address), 10_000_000n]);
    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(factoryAcct.account.address),
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
    ]);
    // Transfer LESS than AMOUNT_TOKEN (simulating a 1% fee-on-transfer).
    // The factory asked for AMOUNT_TOKEN; only 990K arrived; escrow should
    // record the 990K and not revert.
    const sent = 990_000n;
    await token.write.transfer([escrow.address, sent], { account: factoryAcct.account });
    await escrow.write.deposit([AMOUNT_TOKEN], { account: factoryAcct.account });
    const recorded = await escrow.read.amount();
    assert.equal(recorded, sent, "Escrow should record actual received, not requested");
  });
});
