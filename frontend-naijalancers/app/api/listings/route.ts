import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const supabase = createServerClient();

    let query = supabase
      .from("marketplace_escrows")
      .select("escrow_id, contract_address, description, amount_usdc, amount_fiat, currency, seller_wallet, created_at, status")
      .eq("status", "PENDING_PAYMENT")
      .not("contract_address", "is", null)
      .not("description", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.ilike("description", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, listings: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
