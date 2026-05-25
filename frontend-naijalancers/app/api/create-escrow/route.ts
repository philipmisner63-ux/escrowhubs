import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";
import { createServerClient, type MarketplaceEscrow } from "@/lib/supabase";

/**
 * Generic helper to send an email via the Resend API.
 *
 * @param to     Recipient email address
 * @param subject
 * @param html
 */
async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "escrow@escrowhubs.io";

  if (!resendKey) {
    console.warn("[create-escrow] RESEND_API_KEY not set, skipping email");
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
      seller_wallet,
      seller_email,
      buyer_email,
      buyer_contact,
      amount_fiat,
      amount_cusd,
      currency,
      description,
      chain_id,
      contract_address,
      on_chain_escrow_id,
      tx_hash,
      initiator_is_buyer,
    } = body;

    if (!seller_email) {
      return NextResponse.json(
        { success: false, error: "seller_email is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate a short ID for shareable URL
    const escrow_id = crypto.randomUUID();

    const { data, error } = await supabase
      .from("marketplace_escrows")
      .insert({
        escrow_id,
        seller_wallet,
        seller_email,
        buyer_email: buyer_email || "pending@escrowhubs.io",
        buyer_phone: buyer_contact,
        amount_fiat,
        amount_usdc: amount_cusd,
        currency,
        description,
        chain_id,
        contract_address,
        on_chain_escrow_id,
        status: "PENDING_PAYMENT",
        protocol_fee_usdc: amount_cusd ? amount_cusd * 0.02 : 0,
        arbitration_enabled: false,
        tx_hash,
      })
      .select()
      .single();

    if (error) throw error;

    const escrow = data as MarketplaceEscrow;
    const escrowUrl = `https://marketplace.escrowhubs.io/escrow/${escrow_id}`;

    // Try to notify the counterparty by email
    try {
      if (initiator_is_buyer && buyer_email) {
        // Buyer initiated: notify SELLER that payment is waiting
        await sendEmail(
          seller_email,
          "Someone has secured payment for your service on NaijaLancers",
          `<h2>Payment Secured</h2>
           <p><strong>${buyer_email}</strong> has created a secured payment for <strong>₦${amount_fiat?.toLocaleString() ?? 0}</strong> on NaijaLancers.</p>
           <p>Description: ${description ?? ""}</p>
           <p><a href="${escrowUrl}">Click here to view the escrow</a></p>`
        );
      } else if (!initiator_is_buyer && buyer_email) {
        // Seller initiated: notify BUYER that payment request is waiting
        await sendEmail(
          buyer_email,
          "You have a payment request on NaijaLancers",
          `<h2>Payment Request</h2>
           <p><strong>${seller_email}</strong> has requested a payment for <strong>₦${amount_fiat?.toLocaleString() ?? 0}</strong> on NaijaLancers.</p>
           <p>Description: ${description ?? ""}</p>
           <p><a href="${escrowUrl}">Click here to view and pay</a></p>`
        );
      }
    } catch (emailErr) {
      console.error("[create-escrow] Email send failed:", emailErr);
      // Non-blocking — escrow is already created
    }

    // Try SMS notification
    try {
      if (!initiator_is_buyer && buyer_contact) {
        // Seller initiated: SMS the buyer
        await sendSms(
          buyer_contact,
          `EscrowHubs: New escrow for ${amount_fiat?.toLocaleString() ?? 0} NGN created. View: https://marketplace.escrowhubs.io/escrow/${escrow_id}`
        );
      }
    } catch (smsErr) {
      console.error("[create-escrow] SMS send failed:", smsErr);
      // Non-blocking
    }

    return NextResponse.json({ success: true, escrow });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create escrow" },
      { status: 500 }
    );
  }
}
