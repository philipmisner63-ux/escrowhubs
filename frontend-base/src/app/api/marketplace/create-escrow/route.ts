import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const PRIVY_API = "https://auth.privy.io/api/v1";

function privyBasicAuth() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const appSecret = process.env.PRIVY_APP_SECRET!;
  return "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");
}

async function getOrCreatePrivyUser(email: string): Promise<string | null> {
  const auth = privyBasicAuth();

  // Try to create
  const createRes = await fetch(`${PRIVY_API}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    },
    body: JSON.stringify({
      create_ethereum_wallet: true,
      linked_accounts: [{ type: "email", address: email }],
    }),
  });

  if (createRes.ok) {
    const user = await createRes.json();
    const wallet = user.linked_accounts?.find(
      (a: { type: string; address: string }) => a.type === "wallet"
    );
    return wallet?.address ?? null;
  }

  if (createRes.status === 409) {
    // User already exists — fetch by email
    const searchRes = await fetch(
      `${PRIVY_API}/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: auth,
          "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        },
      }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const users = data.data ?? data.users ?? (Array.isArray(data) ? data : [data]);
      const user = users[0];
      const wallet = user?.linked_accounts?.find(
        (a: { type: string; address: string }) => a.type === "wallet"
      );
      return wallet?.address ?? null;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { seller_email, buyer_email, amount_fiat, description, arbitration_enabled } =
      await req.json();

    if (!seller_email || !buyer_email || !amount_fiat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const amount = parseFloat(amount_fiat);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const escrow_id = crypto.randomUUID().slice(0, 8);
    const protocol_fee_usdc = parseFloat((amount * 0.005).toFixed(6));
    const amount_usdc = amount;

    // Create Privy embedded wallets for seller + buyer
    const [seller_wallet, buyer_wallet] = await Promise.all([
      getOrCreatePrivyUser(seller_email),
      getOrCreatePrivyUser(buyer_email),
    ]);

    const supabase = createServerClient();
    const { error } = await supabase.from("marketplace_escrows").insert({
      escrow_id,
      seller_email,
      seller_wallet,
      buyer_email,
      buyer_wallet,
      amount_fiat: amount,
      amount_usdc,
      protocol_fee_usdc,
      arbitration_enabled: arbitration_enabled ?? true,
      status: "PENDING_PAYMENT",
      chain_id: 8453,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create escrow" }, { status: 500 });
    }

    // Send email to buyer
    const escrow_url = `https://base.escrowhubs.io/en/marketplace/escrow/${escrow_id}`;
    const resendKey = process.env.RESEND_API_KEY!;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "escrow@escrowhubs.io";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: buyer_email,
        subject: "You have a protected payment waiting on EscrowHubs",
        html: `<h2>Protected Payment Request</h2><p><strong>${seller_email}</strong> has created an escrow for <strong>$${amount.toFixed(2)} USDC</strong>.</p><p>Description: ${description ?? ""}</p><p><a href="${escrow_url}">Click here to complete payment</a></p>`,
      }),
    });

    return NextResponse.json({ escrow_id, escrow_url });
  } catch (err) {
    console.error("create-escrow error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
