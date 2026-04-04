import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK = process.env.SUPPORT_DISCORD_WEBHOOK ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      issueType,
      description,
      wallet,
      escrowId,
      route,
      browser,
      timestamp,
      chainId,
      connectionStatus,
      contractState,
      lastTxHash,
    } = body;

    if (!DISCORD_WEBHOOK) {
      console.warn("SUPPORT_DISCORD_WEBHOOK not set — support report dropped");
      return NextResponse.json({ success: true });
    }

    const lines = [
      `## 🛟 Support Request`,
      `**Issue:** ${issueType}`,
      description ? `**Description:** ${description}` : null,
      ``,
      `### Metadata`,
      `- **Wallet:** ${wallet ?? "not connected"}`,
      `- **Chain ID:** ${chainId ?? "unknown"}`,
      `- **Connection:** ${connectionStatus}`,
      `- **Route:** ${route}`,
      escrowId ? `- **Escrow ID:** \`${escrowId}\`` : null,
      contractState != null ? `- **Contract State:** ${contractState}` : null,
      lastTxHash ? `- **Last Tx:** \`${lastTxHash}\`` : null,
      `- **Browser:** ${browser}`,
      `- **Time:** ${timestamp}`,
    ].filter(Boolean).join("\n");

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: lines }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Support route error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
