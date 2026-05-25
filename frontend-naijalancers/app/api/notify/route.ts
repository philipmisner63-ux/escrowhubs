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

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "escrow@escrowhubs.io";

    if (!resendKey) {
      console.warn("[notify] RESEND_API_KEY not set — skipping email notification");
      return NextResponse.json({ success: true, notified: false, reason: "no_resend_key" });
    }

    // Build the URL to the escrow detail page
    const escrowUrl = `https://marketplace.escrowhubs.io/escrow/${escrow.escrow_id}`;

    // Notify the SELLER that the escrow has been funded
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: escrow.seller_email,
        subject: "Your NaijaLancers escrow has been funded",
        html: `<h2>Escrow Funded</h2>
               <p>Great news! <strong>${escrow.buyer_email}</strong> has funded the escrow for <strong>₦${(escrow.amount_fiat ?? 0).toLocaleString()}</strong>.</p>
               <p>Description: ${escrow.description ?? ""}</p>
               <p>The funds are locked and will be released to you once the buyer confirms delivery.</p>
               <p><a href="${escrowUrl}">View your escrow</a></p>`,
      }),
    });

    return NextResponse.json({ success: true, notified: true });
  } catch (err) {
    console.error("notify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
