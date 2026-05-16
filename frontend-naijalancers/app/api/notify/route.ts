import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Chunk 2: wire up seller notification (WhatsApp/email)
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
