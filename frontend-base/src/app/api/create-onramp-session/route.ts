import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * MoonPay URL signing endpoint.
 * Generates a signed MoonPay widget URL so wallet addresses and amounts
 * are passed securely without exposing the secret key to the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currencyCode = "usdc_base",
      walletAddress,
      baseCurrencyAmount,
      email,
    } = body;

    const secretKey = process.env.MOONPAY_SECRET_KEY;
    const apiKey = process.env.NEXT_PUBLIC_MOONPAY_API_KEY;

    if (!secretKey || !apiKey) {
      return NextResponse.json({ error: "MoonPay not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
      apiKey,
      currencyCode,
      colorCode: "%231a1a2e",
      theme: "dark",
    });

    if (walletAddress) params.set("walletAddress", walletAddress);
    if (baseCurrencyAmount) params.set("baseCurrencyAmount", String(baseCurrencyAmount));
    if (email) params.set("email", email);

    // Sign the query string
    const queryString = `?${params.toString()}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(queryString)
      .digest("base64");

    params.set("signature", signature);

    const widgetUrl = `https://buy.moonpay.com?${params.toString()}`;

    return NextResponse.json({ widgetUrl });
  } catch (err) {
    console.error("MoonPay session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
