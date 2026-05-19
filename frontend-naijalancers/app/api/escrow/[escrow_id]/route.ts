import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ escrow_id: string }> }
) {
  try {
    const { escrow_id } = await params;
    const supabase = createServerClient();

    // Try lookup by escrow_id (UUID) first, then by contract_address
    let { data, error } = await supabase
      .from("marketplace_escrows")
      .select("*")
      .eq("escrow_id", escrow_id)
      .single();

    if (!data && !error) {
      // Not found by escrow_id — try contract_address (shareable link case)
      const result = await supabase
        .from("marketplace_escrows")
        .select("*")
        .eq("contract_address", escrow_id)
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, escrow: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch escrow" },
      { status: 500 }
    );
  }
}
