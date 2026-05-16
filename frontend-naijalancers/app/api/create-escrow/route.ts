import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type MarketplaceEscrow } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      seller_wallet,
      buyer_contact,
      amount_fiat,
      amount_cusd,
      currency,
      description,
      chain_id,
      contract_address,
      on_chain_escrow_id,
    } = body;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("marketplace_escrows")
      .insert({
        escrow_id: crypto.randomUUID(),
        seller_wallet,
        buyer_phone: buyer_contact,
        amount_fiat,
        amount_usdc: amount_cusd,
        currency,
        description,
        chain_id,
        contract_address,
        on_chain_escrow_id,
        status: "PENDING_PAYMENT",
        protocol_fee_usdc: amount_cusd * 0.005,
        arbitration_enabled: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, escrow: data as MarketplaceEscrow });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create escrow" },
      { status: 500 }
    );
  }
}
