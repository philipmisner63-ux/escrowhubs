import { NextRequest, NextResponse } from "next/server";
import { ethers, JsonRpcProvider, Wallet, Contract } from "ethers";
import { supabaseServer } from "@/lib/supabase";
import { decryptPrivateKey } from "@/lib/encryption";

const CELO_RPC = "https://forno.celo.org";
const provider = new JsonRpcProvider(CELO_RPC);

const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, destination, amount } = body;

    if (!userAddress || !destination || !amount) {
      return NextResponse.json(
        { error: "userAddress, destination, and amount required" },
        { status: 400 }
      );
    }

    // Validate addresses
    if (!ethers.isAddress(userAddress) || !ethers.isAddress(destination)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Fetch encrypted key for managed wallet
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

    // Check USDT balance
    const token = new Contract(USDT_CELO, ERC20_TRANSFER_ABI, wallet);
    const decimals = await token.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    const balance = await token.balanceOf(userAddress);
    if (balance < amountWei) {
      return NextResponse.json(
        { error: "Insufficient USDT balance" },
        { status: 400 }
      );
    }

    // Send token transfer
    const gasEstimate = await token.transfer.estimateGas(destination, amountWei);
    const tx = await token.transfer(destination, amountWei, {
      gasLimit: (gasEstimate * 120n) / 100n,
    });

    return NextResponse.json({
      status: "sent",
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error("[Wallet Withdraw] Error:", err);
    return NextResponse.json(
      { error: err.message || "Withdrawal failed" },
      { status: 500 }
    );
  }
}
