import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function isPhone(s: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(s.replace(/[\s\-().]/g, ""));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const seller_contact = body.seller_contact ?? body.seller_email;
    const buyer_contact = body.buyer_contact ?? body.buyer_email;
    const seller_wallet = body.seller_wallet ?? null;
    const { amount_fiat, description, arbitration_enabled } = body;

    if (!seller_contact || !buyer_contact || !amount_fiat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const amount = parseFloat(amount_fiat);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const escrow_id = crypto.randomUUID().slice(0, 8);
    const protocol_fee_usdc = parseFloat((amount * 0.005).toFixed(6));
    const amount_usdc = amount;

    const supabase = createServerClient();
    const { error } = await supabase.from("marketplace_escrows").insert({
      escrow_id,
      seller_email: seller_contact,
      seller_wallet: seller_wallet,
      buyer_email: buyer_contact,
      buyer_wallet: null, // buyer wallet created when they sign in to pay
      amount_fiat: amount,
      amount_usdc,
      protocol_fee_usdc,
      description: description ?? "",
      arbitration_enabled: arbitration_enabled ?? true,
      status: "PENDING_PAYMENT",
      chain_id: 8453,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create escrow" }, { status: 500 });
    }

    const escrow_url = `https://base.escrowhubs.io/en/marketplace/escrow/${escrow_id}`;
    let buyer_notified_by: "email" | "link_only" = "link_only";

    if (!isPhone(buyer_contact)) {
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
          to: buyer_contact,
          subject: "You have a protected payment waiting on EscrowHubs",
          html: `<h2>Protected Payment Request</h2><p><strong>${seller_contact}</strong> has created an escrow for <strong>$${amount.toFixed(2)} USDC</strong>.</p><p>Description: ${description ?? ""}</p><p><a href="${escrow_url}">Click here to complete payment</a></p>`,
        }),
      });
      buyer_notified_by = "email";
    }

    return NextResponse.json({ escrow_id, escrow_url, buyer_notified_by });
  } catch (err) {
    console.error("create-escrow error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
