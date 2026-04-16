import { NextRequest, NextResponse } from "next/server";

const STG_BASE = "https://api-gateway-stg.transak.com";
const PROD_BASE = "https://api-gateway.transak.com";
const TOKEN_URL_STG = "https://api-stg.transak.com/api/v2/refresh-token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { network = "base", amount, walletAddress } = body;

    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
    const apiSecret = process.env.TRANSAK_API_SECRET;
    const isProd = process.env.TRANSAK_ENV === "production";

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Transak not configured" }, { status: 500 });
    }

    const baseUrl = isProd ? PROD_BASE : STG_BASE;
    const referrerDomain = isProd ? "base.escrowhubs.io" : "base.escrowhubs.io";

    // Step 1: Get partner access token
    const tokenRes = await fetch(TOKEN_URL_STG, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, apiSecret }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Transak token error:", err);
      return NextResponse.json({ error: "Failed to authenticate with Transak" }, { status: 502 });
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.data?.accessToken;

    if (!accessToken) {
      console.error("No access token in response:", JSON.stringify(tokenJson));
      return NextResponse.json({ error: "No access token from Transak" }, { status: 502 });
    }

    // Step 2: Build widget params
    const widgetParams: Record<string, string> = {
      apiKey,
      referrerDomain,
      network: network === "base" ? "base" : "polygon",
      cryptoCurrencyCode: "USDC",
      themeColor: "00d4ff",
      colorMode: "DARK",
      exchangeScreenTitle: "Fund Escrow",
      hideMenu: "true",
      productsAvailed: "BUY",
    };

    if (amount) widgetParams.fiatAmount = String(amount);
    if (walletAddress) {
      widgetParams.walletAddress = walletAddress;
      widgetParams.disableWalletAddressForm = "true";
    }

    // Step 3: Create secure widget session
    const sessionRes = await fetch(`${baseUrl}/api/v2/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
      },
      body: JSON.stringify({ widgetParams }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      console.error("Transak session error:", err);
      return NextResponse.json({ error: "Failed to create Transak session" }, { status: 502 });
    }

    const sessionJson = await sessionRes.json();
    const widgetUrl = sessionJson?.data?.widgetUrl;

    if (!widgetUrl) {
      console.error("No widgetUrl in response:", JSON.stringify(sessionJson));
      return NextResponse.json({ error: "No widget URL from Transak" }, { status: 502 });
    }

    return NextResponse.json({ widgetUrl });
  } catch (err) {
    console.error("Transak session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
