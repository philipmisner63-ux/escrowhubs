/**
 * Telegram Notification Dispatcher + Long-Poll Bot
 *
 * Exports:
 *   notifyParties(escrowId, eventType, eventData, parties) — fire-and-forget
 *   startTelegramBot() — long-poll loop, call once on oracle startup
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
// notifications.json lives in the frontend dir (served by Next.js API routes)
const PREFS_FILE  = path.join(__dirname, "..", "frontend", "notifications.json");
// Read lazily so dotenv in index.js has time to populate process.env
function getBotToken() { return process.env.TELEGRAM_BOT_TOKEN ?? ""; }
const APP_URL     = "https://app.escrowhubs.io";
const DISCORD_WEBHOOK = process.env.SUPPORT_DISCORD_WEBHOOK ?? "";

// ─── Event meta ───────────────────────────────────────────────────────────────

const EVENT_META = {
  escrow_created:      { emoji: "🔐", title: "You've Been Invited to an Escrow",     desc: d => `A new escrow of ${d.amount} ${d.symbol} has been created and you're a party.` },
  escrow_funded:       { emoji: "💰", title: "Escrow Funded",                         desc: d => `The escrow has been funded with ${d.amount} ${d.symbol}.` },
  funds_released:      { emoji: "✅", title: "Funds Released",                        desc: d => `${d.amount} ${d.symbol} has been released to you.` },
  dispute_opened:      { emoji: "⚠️",  title: "Dispute Opened",                       desc: d => `A dispute has been raised on this escrow.` },
  dispute_resolved:    { emoji: "⚖️",  title: "Dispute Resolved",                     desc: d => `The dispute has been resolved.${d.ruling ? ` Ruling: ${d.ruling}.` : ""}` },
  milestone_completed: { emoji: "🏁", title: "Milestone Completed",                  desc: d => `Milestone #${d.milestoneIndex ?? "?"} has been completed.` },
  evidence_requested:  { emoji: "📋", title: "Evidence Required — Action Needed",    desc: d => `The AI arbiter reviewed your claim and needs supporting proof.\n\n<b>Your claim:</b> "${d.claim}"\n\n<b>What to submit:</b> ${d.challengePrompt}\n\nPlease open the evidence panel on your escrow page and upload within ${d.windowHours || 4} hours.` },
};

// ─── Preferences ──────────────────────────────────────────────────────────────

function loadPrefs() {
  try {
    if (!fs.existsSync(PREFS_FILE)) return {};
    const raw = fs.readFileSync(PREFS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePrefs(data) {
  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("savePrefs error:", err.message);
  }
}

function getPrefsForWallet(wallet) {
  return loadPrefs()[wallet?.toLowerCase()] ?? null;
}

function linkChatId(wallet, chatId) {
  const all   = loadPrefs();
  const key   = wallet.toLowerCase();
  const ALL_EVENTS = ["escrow_created","escrow_funded","funds_released","dispute_opened","dispute_resolved","milestone_completed","evidence_requested"];
  const existing   = all[key] ?? {};
  all[key] = {
    ...existing,
    wallet:          key,
    telegramChatId:  String(chatId),
    telegramEnabled: existing.telegramEnabled ?? Object.fromEntries(ALL_EVENTS.map(e => [e, true])),
    updatedAt:       new Date().toISOString(),
  };
  savePrefs(all);
}

// ─── Telegram API helpers ─────────────────────────────────────────────────────

async function tgCall(method, body) {
  const BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return null;
  const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
  try {
    const res = await fetch(`${TG}/${method}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    return res.ok ? res.json() : null;
  } catch (err) {
    console.error(`Telegram ${method} error:`, err.message);
    return null;
  }
}

async function sendMessage(chatId, html) {
  return tgCall("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: false });
}

// ─── Long-poll bot ────────────────────────────────────────────────────────────

let _offset = 0;
let _running = false;

async function processUpdate(update) {
  const msg  = update.message;
  if (!msg) return;

  const chatId = msg.chat?.id;
  const text   = (msg.text ?? "").trim();

  if (text.startsWith("/start")) {
    const wallet = text.split(" ")[1]?.toLowerCase() ?? "";

    if (/^0x[0-9a-f]{40}$/.test(wallet)) {
      linkChatId(wallet, chatId);
      console.log(`📲 Telegram linked: ${wallet} → chat ${chatId}`);
      await sendMessage(chatId,
        `🔐 <b>EscrowHubs</b>\n\n` +
        `✅ Telegram linked to wallet:\n<code>${wallet}</code>\n\n` +
        `You'll receive notifications about your escrow activity here.\n\n` +
        `<a href="${APP_URL}">Open EscrowHubs</a>`
      );
    } else {
      await sendMessage(chatId,
        `🔐 <b>EscrowHubs</b>\n\n` +
        `⚠️ No wallet address found. Please tap <b>Link Telegram</b> inside the app to connect.`
      );
    }
  }
}

export async function startTelegramBot() {
  const BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) {
    console.log("ℹ️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }
  const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

  // Verify token works
  const me = await tgCall("getMe", {});
  if (!me?.ok) {
    console.error("❌ Telegram bot token invalid or network error");
    return;
  }
  console.log(`🤖 Telegram bot @${me.result.username} started (long-poll)`);

  _running = true;

  async function poll() {
    while (_running) {
      try {
        const res = await fetch(
          `${TG}/getUpdates?offset=${_offset}&timeout=30&allowed_updates=["message"]`,
          { signal: AbortSignal.timeout(35_000) }
        );
        if (!res.ok) { await sleep(5_000); continue; }
        const data = await res.json();
        if (!data.ok) { await sleep(5_000); continue; }

        for (const update of data.result ?? []) {
          _offset = update.update_id + 1;
          processUpdate(update).catch(err => console.error("processUpdate error:", err.message));
        }
      } catch (err) {
        if (_running) {
          console.error("Telegram poll error:", err.message);
          await sleep(5_000);
        }
      }
    }
  }

  poll(); // fire-and-forget loop
}

export function stopTelegramBot() { _running = false; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function buildMessage(eventType, eventData, escrowId) {
  const meta = EVENT_META[eventType] ?? { emoji: "🔔", title: eventType, desc: () => "" };
  const url  = `${APP_URL}/escrow/${escrowId}`;
  return (
    `${meta.emoji} <b>${meta.title}</b>\n\n` +
    `${meta.desc(eventData)}\n\n` +
    `<code>${escrowId}</code>\n` +
    `<a href="${url}">View Escrow →</a>`
  );
}

async function discordAdminAlert(eventType, escrowId, parties, chainId) {
  if (!DISCORD_WEBHOOK) return;
  const meta = EVENT_META[eventType] ?? { emoji: "🔔", title: eventType };
  try {
    await fetch(DISCORD_WEBHOOK, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${meta.emoji} **${meta.title}** | \`${escrowId}\` | Chain ${chainId} | Parties: ${parties.filter(Boolean).map(p => `\`${p}\``).join(", ")}`,
      }),
    });
  } catch { /* silent */ }
}

/**
 * Notify all relevant parties about an escrow event.
 * Fire-and-forget — never throws.
 *
 * @param {string}   escrowId  — contract address
 * @param {string}   eventType — one of EVENT_META keys
 * @param {object}   eventData — { amount, symbol, chainId, milestoneIndex, ruling, … }
 * @param {string[]} parties   — wallet addresses to notify
 */
export async function notifyParties(escrowId, eventType, eventData, parties) {
  setImmediate(async () => {
    try {
      const text = buildMessage(eventType, eventData, escrowId);
      const jobs = [];

      for (const wallet of parties) {
        if (!wallet) continue;
        const prefs = getPrefsForWallet(wallet);
        if (!prefs?.telegramChatId) continue;
        if (prefs.telegramEnabled?.[eventType] === false) continue;

        jobs.push(
          sendMessage(prefs.telegramChatId, text)
            .catch(err => console.error(`Telegram notify error (${wallet}):`, err.message))
        );
      }

      await Promise.allSettled(jobs);
      await discordAdminAlert(eventType, escrowId, parties, eventData.chainId).catch(() => {});

      if (jobs.length > 0) {
        console.log(`📬 [${eventType}] notified ${jobs.length} party(ies) for ${escrowId}`);
      }
    } catch (err) {
      console.error("notifyParties error:", err.message);
    }
  });
}
