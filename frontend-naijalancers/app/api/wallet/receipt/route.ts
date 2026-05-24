import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";

const CELO_RPC = "https://forno.celo.org";
const provider = new JsonRpcProvider(CELO_RPC);

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "hash required" }, { status: 400 });
  }

  try {
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt) {
      return NextResponse.json({ status: "pending" });
    }
    return NextResponse.json({
      status: receipt.status === 1 ? "success" : "failed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      logs: receipt.logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to get receipt" },
      { status: 500 }
    );
  }
}
