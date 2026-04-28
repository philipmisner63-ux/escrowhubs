import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1490707454751805491/KAkk03OzxRorelrIS6YvzqvwnnEypx9Gn-kbkVHFK9KjCDauIe2Po6O5Mp1u_a0ewVNf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type: "support" | "feature" | "rating";
      message: string;
      rating?: number;
      wallet?: string;
      route?: string;
      isMiniPay?: boolean;
    };

    const { type, message, rating, wallet, route, isMiniPay } = body;
    const timestamp = new Date().toUTCString();

    let content: string;
    if (type === "support") {
      content = [
        "## 🛟 Support — celo.escrowhubs.io",
        `**Issue:** ${message}`,
        `**Wallet:** ${wallet ?? "—"}`,
        `**Page:** ${route ?? "—"}`,
        `**MiniPay:** ${isMiniPay ?? false}`,
        `**Time:** ${timestamp}`,
      ].join("\n");
    } else if (type === "feature") {
      content = [
        "## 💡 [Feature Request] — celo.escrowhubs.io",
        `**Idea:** ${message}`,
        `**Wallet:** ${wallet ?? "—"}`,
        `**Time:** ${timestamp}`,
      ].join("\n");
    } else {
      content = [
        `## ⭐ Rating ${rating ?? "?"}/5 — celo.escrowhubs.io`,
        `**Comment:** ${message}`,
        `**Wallet:** ${wallet ?? "—"}`,
        `**MiniPay:** ${isMiniPay ?? false}`,
        `**Time:** ${timestamp}`,
      ].join("\n");
    }

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    // never surface errors
  }

  return NextResponse.json({ success: true });
}
