import { NextRequest, NextResponse } from "next/server";

// Countries where Stripe Crypto Onramp is available
const STRIPE_COUNTRIES = new Set([
  "US","AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GI","GR",
  "HU","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK",
  "SI","ES","SE","CH","GB",
]);

// New York state blocks Stripe USDC on Base/Polygon — detected via header if possible
// We can't detect state from IP easily, so we flag US and let frontend warn NY users

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "";

    // Skip for local/private IPs
    const isLocal =
      ip === "" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("::1");

    if (isLocal) {
      return NextResponse.json({ onramp: "stripe", country: "US", local: true });
    }

    // Use ip-api.com (free, no key needed, 45 req/min)
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,country`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!geo.ok) throw new Error("Geo lookup failed");

    const { countryCode, country } = await geo.json();

    const onramp = STRIPE_COUNTRIES.has(countryCode) ? "stripe" : "transak";

    return NextResponse.json({ onramp, country, countryCode });
  } catch {
    // Default to Transak on failure — broader coverage
    return NextResponse.json({ onramp: "transak", country: null, countryCode: null });
  }
}
