import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json({ success: false, error: "Missing wallet" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("marketplace_escrows")
      .select("*")
      .or(`seller_wallet.eq.${wallet},buyer_wallet.eq.${wallet}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, escrows: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch escrows" },
      { status: 500 }
    );
  }
}
