import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const CELO_RPC = "https://forno.celo.org";
const MIN_BALANCE = ethers.parseEther("0.5"); // 0.5 CELO
const FUND_AMOUNT = ethers.parseEther("1.0"); // 1.0 CELO

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

    const treasuryKey = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryKey) {
      return NextResponse.json(
        { success: false, error: "Treasury not configured" },
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
    const treasury = new ethers.Wallet(treasuryKey, provider);
    const tx = await treasury.sendTransaction({
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
