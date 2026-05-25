import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const CELO_RPC = "https://forno.celo.org";
const MIN_BALANCE = ethers.parseEther("0.5"); // 0.5 CELO
const FUND_AMOUNT = ethers.parseEther("0.02"); // 0.02 CELO

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { success: false, error: "Valid address required" },
        { status: 400 }
      );
    }

    const gasKey = process.env.GAS_WALLET_PRIVATE_KEY;
    if (!gasKey) {
      return NextResponse.json(
        { success: false, error: "Gas wallet not configured" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(CELO_RPC);
    const balance = await provider.getBalance(address);

    // Already has enough gas — no need to fund
    if (balance >= MIN_BALANCE) {
      return NextResponse.json({
        success: true,
        funded: false,
        reason: "sufficient_balance",
        balance: ethers.formatEther(balance),
      });
    }

    // Fund the wallet
    const gasWallet = new ethers.Wallet(gasKey, provider);
    const tx = await gasWallet.sendTransaction({
      to: address,
      value: FUND_AMOUNT,
    });

    await tx.wait();

    return NextResponse.json({
      success: true,
      funded: true,
      txHash: tx.hash,
      amount: ethers.formatEther(FUND_AMOUNT),
    });
  } catch (err: any) {
    console.error("[Fund Gas] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Funding failed" },
      { status: 500 }
    );
  }
}
