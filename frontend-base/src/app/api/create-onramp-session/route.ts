import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destination_currency = "usdc",
      destination_network = "base",
      destination_exchange_amount,
      wallet_address,
    } = body;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // Get real client IP (behind nginx)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    // Build nested params as flat application/x-www-form-urlencoded
    const params: Record<string, string> = {
      customer_ip_address: ip,
      "transaction_details[destination_currency]": destination_currency,
      "transaction_details[destination_network]": destination_network,
    };

    if (destination_exchange_amount) {
      params["transaction_details[destination_exchange_amount]"] = String(destination_exchange_amount);
    }

    // Lock currency and network so user cannot switch away from USDC
    params["transaction_details[supported_destination_currencies][0]"] = "usdc";
    params["transaction_details[supported_destination_networks][0]"] = destination_network;

    // Stripe only accepts "ethereum" as a wallet_addresses key for EVM chains.
    // Base and Polygon share the same address format — one key covers all.
    if (wallet_address) {
      params["transaction_details[wallet_addresses][ethereum]"] = wallet_address;
    }

    const response = await fetch("https://api.stripe.com/v1/crypto/onramp_sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe onramp error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message ?? "Stripe error" },
        { status: response.status }
      );
    }

    return NextResponse.json({ clientSecret: data.client_secret });
  } catch (err) {
    console.error("Onramp session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
