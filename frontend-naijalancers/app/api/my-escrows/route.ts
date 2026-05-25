import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const email = searchParams.get("email");

    if (!wallet && !email) {
      return NextResponse.json(
        { success: false, error: "Missing wallet or email" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let query = supabase
      .from("marketplace_escrows")
      .select("*")
      .order("created_at", { ascending: false });

    if (wallet && email) {
      // Both provided — OR match on wallet OR email
      query = query.or(
        `seller_wallet.eq.${wallet},buyer_wallet.eq.${wallet},seller_email.eq.${email},buyer_email.eq.${email}`
      );
    } else if (wallet) {
      query = query.or(`seller_wallet.eq.${wallet},buyer_wallet.eq.${wallet}`);
    } else {
      query = query.or(`seller_email.eq.${email},buyer_email.eq.${email}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, escrows: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch escrows" },
      { status: 500 }
    );
  }
}
