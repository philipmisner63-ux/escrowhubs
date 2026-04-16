import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { escrow_id, status, contract_address, on_chain_escrow_id } = await req.json();

    if (!escrow_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (contract_address) updates.contract_address = contract_address;
    if (on_chain_escrow_id) updates.on_chain_escrow_id = on_chain_escrow_id;
    if (status === "FUNDED") updates.funded_at = new Date().toISOString();
    if (status === "RELEASED") updates.released_at = new Date().toISOString();

    const { error } = await supabase
      .from("marketplace_escrows")
      .update(updates)
      .eq("escrow_id", escrow_id);

    if (error) {
      console.error("update-status error:", error);
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
