import { NextRequest, NextResponse } from "next/server";

const NAIJALANCERS_API_URL = process.env.NAIJALANCERS_API_URL || "https://jxybqmquymxkvxxpiuhv.supabase.co/functions/v1/developer-api";
const API_KEY = process.env.NAIJALANCERS_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fiat_amount, destination_address, external_user_id, currency = "USDT" } = body;

    if (!fiat_amount || !destination_address || !external_user_id) {
      return NextResponse.json(
        { error: "fiat_amount, destination_address, and external_user_id required" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "NaijaLancers API key not configured" },
        { status: 500 }
      );
    }

    const payload = {
      fiat_amount,
      destination_address,
      external_user_id,
      currency,
    };

    const res = await fetch(`${NAIJALANCERS_API_URL}/ramp/session/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[Ramp Buy] Awwal API error:", data);
      return NextResponse.json(
        { error: data.error || data.message || "Ramp session creation failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      redirect_url: data.redirect_url,
      session_id: data.session_id,
      reference: data.reference,
    });
  } catch (err: any) {
    console.error("[Ramp Buy] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
