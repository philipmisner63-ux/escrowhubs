import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const supabase = createServerClient();

    const [{ data: selling }, { data: buying }] = await Promise.all([
      supabase
        .from("marketplace_escrows")
        .select("*")
        .eq("seller_email", email)
        .order("created_at", { ascending: false }),
      supabase
        .from("marketplace_escrows")
        .select("*")
        .eq("buyer_email", email)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({ selling: selling ?? [], buying: buying ?? [] });
  } catch (err) {
    console.error("my-escrows error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
