import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const AMOUNT_ETH = parseEther("1.0");
const AMOUNT_TOKEN = 1_000_000n; // 1 USDC (6 decimals)

describe("SimpleEscrow", () => {

  // ─── ETH path ──────────────────────────────────────────────────────────────

  async function deployEth() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      ZERO,
    ]);
    return { escrow, conn, depositor, beneficiary, arbiter };
  }

  it("accepts deposit from depositor", async () => {
    const { escrow } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH });
    assert.equal(await escrow.read.state(), 1); // AWAITING_DELIVERY
  });

  it("releases funds to beneficiary", async () => {
    const { escrow } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH });
    await escrow.write.release();
    assert.equal(await escrow.read.state(), 2); // COMPLETE
  });

  it("arbiter can resolve dispute in favour of beneficiary", async () => {
    const { escrow, arbiter } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH });
    await escrow.write.dispute();
    await escrow.write.resolveRelease([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 2); // COMPLETE
  });

  it("arbiter can refund depositor", async () => {
    const { escrow, arbiter } = await deployEth();
    await escrow.write.deposit([AMOUNT_ETH], { value: AMOUNT_ETH });
    await escrow.write.dispute();
    await escrow.write.resolveRefund([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 4); // REFUNDED
  });

  // ─── ERC-20 path ───────────────────────────────────────────────────────────

  async function deployToken() {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();

    const token = await conn.viem.deployContract("MockERC20", []);
    // Mint tokens to depositor
    await token.write.mint([getAddress(depositor.account.address), 10_000_000n]);

    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
    ]);

    // Transfer tokens to escrow (simulating what factory does)
    await token.write.transfer([escrow.address, AMOUNT_TOKEN]);

    return { escrow, token, conn, depositor, beneficiary, arbiter };
  }

  it("[ERC-20] accepts token deposit", async () => {
    const { escrow, token } = await deployToken();
    await escrow.write.deposit([AMOUNT_TOKEN]);
    assert.equal(await escrow.read.state(), 1); // AWAITING_DELIVERY
    assert.equal(await token.read.balanceOf([escrow.address]), AMOUNT_TOKEN);
  });

  it("[ERC-20] releases tokens to beneficiary", async () => {
    const { escrow, token, beneficiary } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    await escrow.write.deposit([AMOUNT_TOKEN]);
    await escrow.write.release();
    assert.equal(await escrow.read.state(), 2); // COMPLETE
    const balAfter = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] arbiter resolves dispute — release tokens", async () => {
    const { escrow, token, beneficiary, arbiter } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    await escrow.write.deposit([AMOUNT_TOKEN]);
    await escrow.write.dispute();
    await escrow.write.resolveRelease([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 2);
    const balAfter = await token.read.balanceOf([getAddress(beneficiary.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] arbiter refunds tokens to depositor", async () => {
    const { escrow, token, depositor, arbiter } = await deployToken();
    const balBefore = await token.read.balanceOf([getAddress(depositor.account.address)]);
    await escrow.write.deposit([AMOUNT_TOKEN]);
    await escrow.write.dispute();
    await escrow.write.resolveRefund([], { account: arbiter.account });
    assert.equal(await escrow.read.state(), 4);
    const balAfter = await token.read.balanceOf([getAddress(depositor.account.address)]);
    assert.equal(balAfter - balBefore, AMOUNT_TOKEN);
  });

  it("[ERC-20] reverts if ETH sent with token escrow", async () => {
    const { escrow } = await deployToken();
    await assert.rejects(
      escrow.write.deposit([AMOUNT_TOKEN], { value: 1n }),
      /Do not send ETH/
    );
  });

  it("[ERC-20] reverts if token balance insufficient", async () => {
    const conn = await hre.network.connect();
    const [depositor, beneficiary, arbiter] = await conn.viem.getWalletClients();
    const token = await conn.viem.deployContract("MockERC20", []);
    const escrow = await conn.viem.deployContract("SimpleEscrow", [
      getAddress(depositor.account.address),
      getAddress(beneficiary.account.address),
      getAddress(arbiter.account.address),
      token.address,
    ]);
    // No tokens transferred — should revert
    await assert.rejects(
      escrow.write.deposit([AMOUNT_TOKEN]),
      /Token not received/
    );
  });
});
