import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PREFS_FILE = path.join(process.cwd(), "notifications.json");

export type EventKey =
  | "escrow_created"
  | "escrow_funded"
  | "funds_released"
  | "dispute_opened"
  | "dispute_resolved"
  | "milestone_completed";

export interface NotificationPrefs {
  wallet:  string;
  email:   string | null;
  emailEnabled: Partial<Record<EventKey, boolean>>;
  telegramChatId: string | null;
  telegramEnabled: Partial<Record<EventKey, boolean>>;
  updatedAt: string;
}

function loadAll(): Record<string, NotificationPrefs> {
  try {
    if (!fs.existsSync(PREFS_FILE)) return {};
    const raw = fs.readFileSync(PREFS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, NotificationPrefs>) {
  fs.writeFileSync(PREFS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const all = loadAll();
  return NextResponse.json(all[wallet] ?? null);
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<NotificationPrefs> = await req.json();
    if (!body.wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
    const key = body.wallet.toLowerCase();
    const all = loadAll();
    all[key] = {
      wallet:          key,
      email:           body.email ?? all[key]?.email ?? null,
      emailEnabled:    body.emailEnabled ?? all[key]?.emailEnabled ?? {},
      telegramChatId:  body.telegramChatId ?? all[key]?.telegramChatId ?? null,
      telegramEnabled: body.telegramEnabled ?? all[key]?.telegramEnabled ?? {},
      updatedAt:       new Date().toISOString(),
    };
    saveAll(all);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notifications/preferences POST error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
