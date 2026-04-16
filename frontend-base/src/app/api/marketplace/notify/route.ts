import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { escrow_id } = await req.json();

    if (!escrow_id) {
      return NextResponse.json({ error: "Missing escrow_id" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: escrow, error } = await supabase
      .from("marketplace_escrows")
      .select("*")
      .eq("escrow_id", escrow_id)
      .single();

    if (error || !escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    const resendKey = process.env.RESEND_API_KEY!;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "escrow@escrowhubs.io";
    const escrow_url = `https://base.escrowhubs.io/en/marketplace/dashboard`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: escrow.seller_email,
        subject: "Your escrow has been funded on EscrowHubs",
        html: `<h2>Escrow Funded</h2><p>Great news! <strong>${escrow.buyer_email}</strong> has funded the escrow for <strong>$${escrow.amount_fiat.toFixed(2)} USDC</strong>.</p><p>Description: ${escrow.description ?? ""}</p><p>The funds are locked and will be released to you once the buyer confirms delivery.</p><p><a href="${escrow_url}">View your dashboard</a></p>`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
