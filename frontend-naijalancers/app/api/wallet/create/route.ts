import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { supabaseServer } from "@/lib/supabase";
import { encryptPrivateKey } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, user_id } = body;
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Find or create user by email
    let { data: user } = await sb
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) {
      const { data: newUser, error: userErr } = await sb
        .from("users")
        .insert({ email })
        .select("id")
        .single();
      if (userErr || !newUser) {
        console.error("[Wallet Create] User insert error:", userErr);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      user = newUser;
    }

    // Check if wallet already exists
    const { data: existing } = await sb
      .from("user_wallets")
      .select("wallet_address")
      .eq("user_id", user.id)
      .single();

    if (existing?.wallet_address) {
      return NextResponse.json({ address: existing.wallet_address, created: false });
    }

    // Create new Celo wallet
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

    // Store in Supabase
    const { error: insertError } = await sb.from("user_wallets").insert({
      user_id: user.id,
      wallet_address: wallet.address,
      encrypted_private_key: encryptedPrivateKey,
      chain: "celo",
    });

    if (insertError) {
      console.error("[Wallet Create] Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to store wallet" }, { status: 500 });
    }

    // Fund new wallet with CELO for gas (invisible to user)
    const treasuryKey = process.env.TREASURY_PRIVATE_KEY;
    if (treasuryKey) {
      try {
        const provider = new ethers.JsonRpcProvider("https://forno.celo.org");
        const treasury = new ethers.Wallet(treasuryKey, provider);
        const balance = await provider.getBalance(wallet.address);
        if (balance < ethers.parseEther("0.5")) {
          const tx = await treasury.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther("1.0"),
          });
          await tx.wait();
          console.log(`[Wallet Create] Funded ${wallet.address} with 1.0 CELO, tx: ${tx.hash}`);
        }
      } catch (fundErr: any) {
        console.error("[Wallet Create] Funding error:", fundErr.message);
        // Non-blocking: wallet exists even if funding fails
      }
    }

    return NextResponse.json({ address: wallet.address, created: true });
  } catch (err: any) {
    console.error("[Wallet Create] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
