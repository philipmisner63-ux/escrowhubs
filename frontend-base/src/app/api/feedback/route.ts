import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DISCORD_WEBHOOK = process.env.FEEDBACK_DISCORD_WEBHOOK ?? "";
const LOG_FILE        = path.join(process.cwd(), "feedback.json");

const CATEGORY_EMOJI: Record<string, string> = {
  featureRequest:  "✨",
  bugReport:       "🐛",
  uxImprovement:   "🎨",
  integrationIdea: "🔌",
  other:           "💬",
};

function appendLog(entry: object) {
  try {
    let records: object[] = [];
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, "utf-8").trim();
      if (raw) records = JSON.parse(raw);
    }
    records.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("feedback log write failed:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, description, wallet, timestamp } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const entry = {
      timestamp: timestamp ?? new Date().toISOString(),
      category:  category ?? "other",
      title:     String(title).slice(0, 100),
      description: String(description).slice(0, 1000),
      wallet:    wallet ?? null,
    };

    // Persist to local JSON log
    appendLog(entry);

    // Forward to Discord webhook if configured
    if (DISCORD_WEBHOOK) {
      const emoji = CATEGORY_EMOJI[entry.category] ?? "💬";
      const walletLine = entry.wallet
        ? `\`${entry.wallet}\``
        : "_not connected_";

      const content = [
        `## ${emoji} Feedback: ${entry.title}`,
        `**Category:** ${entry.category.replace(/([A-Z])/g, " $1").trim()}`,
        `**Wallet:** ${walletLine}`,
        `**Time:** ${entry.timestamp}`,
        ``,
        entry.description,
      ].join("\n");

      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback route error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
