import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

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

    return NextResponse.json({ success: true, escrow: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
