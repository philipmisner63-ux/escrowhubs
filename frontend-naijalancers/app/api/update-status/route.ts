import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";
import { createServerClient } from "@/lib/supabase";

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "escrow@escrowhubs.io";

  if (!resendKey) {
    console.warn("[update-status] RESEND_API_KEY not set, skipping email");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      escrow_id,
      status,
      buyer_wallet,
      tx_hash,
      contract_address,
      on_chain_escrow_id,
    } = body;

    if (!escrow_id && !contract_address) {
      return NextResponse.json(
        { success: false, error: "Missing escrow_id or contract_address" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const update: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (buyer_wallet) update.buyer_wallet = buyer_wallet;
    if (tx_hash) update.tx_hash = tx_hash;
    if (contract_address) update.contract_address = contract_address;
    if (on_chain_escrow_id) update.on_chain_escrow_id = on_chain_escrow_id;
    if (status === "FUNDED") update.funded_at = new Date().toISOString();
    if (status === "RELEASED") update.released_at = new Date().toISOString();

    let query = supabase.from("marketplace_escrows").update(update);
    if (escrow_id) {
      query = query.eq("escrow_id", escrow_id);
    } else {
      query = query.eq("contract_address", contract_address);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    const escrow = data;
    const escrowUrl = `https://marketplace.escrowhubs.io/escrow/${escrow.escrow_id}`;
    const amountNgn = escrow.amount_fiat ?? 0;
    const description = escrow.description ?? "";

    // Send state-change emails
    try {
      if (status === "FUNDED" && escrow.seller_email) {
        await sendEmail(
          escrow.seller_email,
          "Your NaijaLancers escrow has been funded",
          `<h2>Escrow Funded</h2>
           <p>Great news! <strong>${escrow.buyer_email}</strong> has funded the escrow for <strong>₦${amountNgn.toLocaleString()}</strong>.</p>
           <p>Description: ${description}</p>
           <p>The funds are locked and will be released to you once the buyer confirms delivery.</p>
           <p><a href="${escrowUrl}">View your escrow</a></p>`
        );
      }

      if (status === "RELEASED" && escrow.buyer_email) {
        await sendEmail(
          escrow.buyer_email,
          "Your NaijaLancers payment has been released",
          `<h2>Payment Released</h2>
           <p>The escrow for <strong>₦${amountNgn.toLocaleString()}</strong> has been released to the seller.</p>
           <p>Description: ${description}</p>
           <p>Thank you for using NaijaLancers!</p>
           <p><a href="${escrowUrl}">View escrow details</a></p>`
        );
      }

      if (status === "DISPUTED") {
        const subject = "A dispute has been raised on your NaijaLancers escrow";
        const html = `<h2>Escrow Disputed</h2>
           <p>A dispute has been raised for the escrow of <strong>₦${amountNgn.toLocaleString()}</strong>.</p>
           <p>Description: ${description}</p>
           <p>Our team will help resolve this. Please check your dashboard for updates.</p>
           <p><a href="${escrowUrl}">View escrow details</a></p>`;
        if (escrow.buyer_email) await sendEmail(escrow.buyer_email, subject, html);
        if (escrow.seller_email) await sendEmail(escrow.seller_email, subject, html);
      }

      if (status === "COMPLETED") {
        const subject = "Your NaijaLancers escrow is complete";
        const html = `<h2>Escrow Complete</h2>
           <p>The escrow for <strong>₦${amountNgn.toLocaleString()}</strong> has been fully resolved.</p>
           <p>Description: ${description}</p>
           <p>Thank you for using NaijaLancers!</p>
           <p><a href="${escrowUrl}">View escrow details</a></p>`;
        if (escrow.buyer_email) await sendEmail(escrow.buyer_email, subject, html);
        if (escrow.seller_email) await sendEmail(escrow.seller_email, subject, html);
      }
    } catch (emailErr) {
      console.error("[update-status] Email send failed:", emailErr);
      // Non-blocking — status is already updated
    }

    // Send SMS notifications
    try {
      if (status === "FUNDED" && escrow.seller_email) {
        const { data: sellerUser } = await supabase
          .from("users")
          .select("phone")
          .eq("email", escrow.seller_email)
          .single();
        await sendSms(
          sellerUser?.phone,
          `EscrowHubs: Your escrow has been funded (${amountNgn.toLocaleString()} NGN). Login to confirm delivery.`
        );
      }

      if (status === "RELEASED" && escrow.buyer_phone) {
        await sendSms(
          escrow.buyer_phone,
          `EscrowHubs: Payment of ${amountNgn.toLocaleString()} NGN released to your wallet.`
        );
      }

      if (status === "DISPUTED") {
        if (escrow.buyer_phone) {
          await sendSms(
            escrow.buyer_phone,
            `EscrowHubs: A dispute has been raised on your escrow. Login to respond.`
          );
        }
        if (escrow.seller_email) {
          const { data: sellerUser } = await supabase
            .from("users")
            .select("phone")
            .eq("email", escrow.seller_email)
            .single();
          await sendSms(
            sellerUser?.phone,
            `EscrowHubs: A dispute has been raised on your escrow. Login to respond.`
          );
        }
      }
    } catch (smsErr) {
      console.error("[update-status] SMS send failed:", smsErr);
      // Non-blocking
    }

    return NextResponse.json({ success: true, escrow });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
