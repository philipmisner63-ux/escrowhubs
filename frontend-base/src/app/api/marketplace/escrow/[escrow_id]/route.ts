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

    if (error || !data) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("get-escrow error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
