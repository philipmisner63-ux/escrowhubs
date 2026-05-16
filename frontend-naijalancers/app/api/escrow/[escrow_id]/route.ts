import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ escrow_id: string }> }
) {
  try {
    const { escrow_id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("marketplace_escrows")
      .select("*")
      .eq("escrow_id", escrow_id)
      .single();

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
