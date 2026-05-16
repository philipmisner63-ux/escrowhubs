import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrow_id, status, buyer_wallet, tx_hash } = body;

    const supabase = createServerClient();

    const update: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (buyer_wallet) update.buyer_wallet = buyer_wallet;
    if (tx_hash) update.tx_hash = tx_hash;
    if (status === "FUNDED") update.funded_at = new Date().toISOString();
    if (status === "RELEASED") update.released_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("marketplace_escrows")
      .update(update)
      .eq("escrow_id", escrow_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, escrow: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
