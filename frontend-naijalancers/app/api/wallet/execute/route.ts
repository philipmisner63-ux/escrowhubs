import { NextRequest, NextResponse } from "next/server";
import { ethers, JsonRpcProvider, Wallet, Contract, Interface } from "ethers";
import { supabaseServer } from "@/lib/supabase";
import { decryptPrivateKey } from "@/lib/encryption";

const CELO_RPC = "https://forno.celo.org";
const provider = new JsonRpcProvider(CELO_RPC);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, contract, abi, method, args = [], value = "0" } = body;

    if (!userAddress || !contract || !abi || !method) {
      return NextResponse.json(
        { error: "userAddress, contract, abi, method required" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();

    // Fetch encrypted key
    const { data: walletRow, error } = await sb
      .from("user_wallets")
      .select("encrypted_private_key")
      .eq("wallet_address", userAddress)
      .single();

    if (error || !walletRow?.encrypted_private_key) {
      return NextResponse.json(
        { error: "Wallet not found for address" },
        { status: 404 }
      );
    }

    // Decrypt key
    const privateKey = decryptPrivateKey(walletRow.encrypted_private_key);
    const wallet = new Wallet(privateKey, provider);

    // Build contract instance
    const contractInstance = new Contract(contract, abi, wallet);

    // Check if method is view/pure from ABI
    const iface = new Interface(abi);
    const fragment = iface.getFunction(method);
    const isReadOnly = fragment?.stateMutability === "view" || fragment?.stateMutability === "pure";

    if (isReadOnly) {
      // Static call — no gas needed, returns value directly
      const result = await contractInstance[method](...args);
      return NextResponse.json({
        status: "success",
        result: typeof result === "bigint" ? result.toString() : result,
        isView: true,
      });
    }

    // State-changing call: estimate gas then send
    const gasEstimate = await contractInstance[method].estimateGas(...args);
    const tx = await contractInstance[method](...args, {
      gasLimit: (gasEstimate * 120n) / 100n,
      value: value && value !== "0" ? BigInt(value) : undefined,
    });

    return NextResponse.json({
      status: "sent",
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error("[Wallet Execute] Error:", err);
    return NextResponse.json(
      { error: err.message || "Transaction failed" },
      { status: 500 }
    );
  }
}
