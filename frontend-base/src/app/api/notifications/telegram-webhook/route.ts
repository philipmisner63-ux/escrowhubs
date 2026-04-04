/**
 * Telegram Bot Webhook endpoint.
 * Telegram calls this URL when the bot receives a message.
 * On /start <walletAddress>: stores the chat_id mapped to that wallet
 * in notifications.json so the oracle can send future messages.
 *
 * Register with:
 *   curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://app.escrowhubs.io/api/notifications/telegram-webhook"
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PREFS_FILE = path.join(process.cwd(), "notifications.json");
const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? "";

function loadAll(): Record<string, object> {
  try {
    if (!fs.existsSync(PREFS_FILE)) return {};
    const raw = fs.readFileSync(PREFS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAll(data: Record<string, object>) {
  fs.writeFileSync(PREFS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function sendMessage(chatId: string | number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(err => console.error("Telegram sendMessage error:", err));
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text   = message.text?.trim() ?? "";

    // Handle /start <walletAddress>
    if (text.startsWith("/start")) {
      const parts  = text.split(" ");
      const wallet = parts[1]?.toLowerCase();

      if (wallet && /^0x[0-9a-f]{40}$/.test(wallet)) {
        const all = loadAll() as Record<string, { telegramChatId?: string; wallet?: string; [k: string]: unknown }>;
        const existing = all[wallet] ?? {};
        all[wallet] = { ...existing, wallet, telegramChatId: String(chatId) };
        saveAll(all);

        await sendMessage(chatId,
          `🔐 <b>EscrowHubs</b>\n\n` +
          `✅ Your Telegram is now linked to wallet:\n<code>${wallet}</code>\n\n` +
          `You'll receive notifications about your escrow activity here.`
        );
      } else {
        await sendMessage(chatId,
          `🔐 <b>EscrowHubs</b>\n\n` +
          `⚠️ No wallet address found.\n\n` +
          `Please use the "Link Telegram" button in the app to connect your wallet.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("telegram-webhook error:", err);
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }
}
