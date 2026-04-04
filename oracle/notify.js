/**
 * Notification Dispatcher
 *
 * notifyParties(escrowId, eventType, eventData, parties)
 *   - Loads preferences from notifications.json
 *   - Sends Telegram + email for enabled channels
 *   - Non-blocking (fire-and-forget), errors logged never thrown
 *   - Discord fallback for admin visibility
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PREFS_FILE         = path.join(__dirname, "..", "frontend", "notifications.json");
const BOT_TOKEN          = process.env.TELEGRAM_BOT_TOKEN ?? "";
const RESEND_API_KEY     = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL         = process.env.NOTIFICATION_FROM_EMAIL ?? "notifications@escrowhubs.io";
const APP_URL            = "https://app.escrowhubs.io";
const DISCORD_WEBHOOK    = process.env.SUPPORT_DISCORD_WEBHOOK ?? "";

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_META = {
  escrow_created:      { emoji: "🔐", title: "Escrow Created",       desc: (d) => `A new escrow has been created for ${d.amount} ${d.symbol}.` },
  escrow_funded:       { emoji: "💰", title: "Escrow Funded",        desc: (d) => `Escrow has been funded with ${d.amount} ${d.symbol}.` },
  funds_released:      { emoji: "✅", title: "Funds Released",       desc: (d) => `${d.amount} ${d.symbol} has been released to you.` },
  dispute_opened:      { emoji: "⚠️",  title: "Dispute Opened",       desc: (d) => `A dispute has been raised on your escrow.` },
  dispute_resolved:    { emoji: "⚖️",  title: "Dispute Resolved",     desc: (d) => `The dispute has been resolved. ${d.ruling ? `Ruling: ${d.ruling}.` : ""}` },
  milestone_completed: { emoji: "🏁", title: "Milestone Completed",  desc: (d) => `Milestone #${d.milestoneIndex ?? "?"}: "${d.milestoneDescription ?? "?"}" has been completed.` },
};

// ─── Preferences loader ───────────────────────────────────────────────────────

function loadPrefs() {
  try {
    if (!fs.existsSync(PREFS_FILE)) return {};
    const raw = fs.readFileSync(PREFS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getPrefsForWallet(wallet) {
  return loadPrefs()[wallet?.toLowerCase()] ?? null;
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(chatId, text) {
  if (!BOT_TOKEN || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) console.error(`Telegram API error: ${res.status}`);
  } catch (err) {
    console.error("Telegram send error:", err.message);
  }
}

function buildTelegramMessage(eventType, eventData, escrowId) {
  const meta = EVENT_META[eventType] ?? { emoji: "🔔", title: eventType, desc: () => "" };
  const url  = `${APP_URL}/escrow/${escrowId}`;
  return (
    `${meta.emoji} <b>${meta.title}</b>\n\n` +
    `${meta.desc(eventData)}\n\n` +
    `Escrow: <code>${escrowId}</code>\n` +
    `<a href="${url}">View on EscrowHubs →</a>`
  );
}

// ─── Email (Resend) ───────────────────────────────────────────────────────────

function buildEmailHtml(eventType, eventData, escrowId) {
  const meta = EVENT_META[eventType] ?? { emoji: "🔔", title: eventType, desc: () => "" };
  const url  = `${APP_URL}/escrow/${escrowId}`;
  const unsubUrl = `${APP_URL}/api/notifications/unsubscribe?wallet=${eventData.wallet ?? ""}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">
            <span style="color:#ffffff;">Escrow</span><span style="color:#00f5ff;">Hubs</span>
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0a0f1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">

          <!-- Event badge -->
          <div style="font-size:36px;text-align:center;margin-bottom:16px;">${meta.emoji}</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;text-align:center;">
            ${meta.title}
          </h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;text-align:center;">
            ${meta.desc(eventData)}
          </p>

          <!-- Escrow ID -->
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 16px;margin-bottom:24px;">
            <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Escrow Address</span><br />
            <span style="font-family:monospace;font-size:13px;color:#06b6d4;">${escrowId}</span>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${url}" style="display:inline-block;background:#00f5ff;color:#030712;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
              View Escrow →
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">
            You're receiving this because you enabled escrow notifications on EscrowHubs.<br />
            <a href="${unsubUrl}" style="color:#64748b;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(toAddress, eventType, eventData, escrowId) {
  if (!RESEND_API_KEY || !toAddress) return;
  const meta    = EVENT_META[eventType] ?? { title: "EscrowHubs Notification" };
  const subject = `${meta.emoji ?? "🔔"} ${meta.title} — EscrowHubs`;
  const html    = buildEmailHtml(eventType, eventData, escrowId);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body:    JSON.stringify({ from: FROM_EMAIL, to: toAddress, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error ${res.status}:`, err);
    }
  } catch (err) {
    console.error("Email send error:", err.message);
  }
}

// ─── Discord fallback ─────────────────────────────────────────────────────────

async function notifyDiscordAdmin(eventType, escrowId, parties, chainId) {
  if (!DISCORD_WEBHOOK) return;
  const meta = EVENT_META[eventType] ?? { emoji: "🔔", title: eventType };
  try {
    await fetch(DISCORD_WEBHOOK, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${meta.emoji} **${meta.title}** | Escrow \`${escrowId}\` | Chain ${chainId} | Parties: ${parties.map(p => `\`${p}\``).join(", ")}`,
      }),
    });
  } catch { /* silent */ }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * Notify all relevant parties about an escrow event.
 *
 * @param {string} escrowId   - Contract address of the escrow
 * @param {string} eventType  - One of the EVENT_META keys
 * @param {object} eventData  - { amount, symbol, chainId, milestoneIndex, milestoneDescription, ruling, wallet }
 * @param {string[]} parties  - Wallet addresses to notify
 */
export async function notifyParties(escrowId, eventType, eventData, parties) {
  // Fire-and-forget: errors must never propagate to caller
  setImmediate(async () => {
    try {
      const notifyPromises = [];

      for (const wallet of parties) {
        if (!wallet) continue;
        const prefs = getPrefsForWallet(wallet);
        if (!prefs) continue;

        // Email
        if (prefs.email && prefs.emailEnabled?.[eventType] !== false) {
          notifyPromises.push(
            sendEmail(prefs.email, eventType, { ...eventData, wallet }, escrowId)
              .catch(err => console.error(`Email error for ${wallet}:`, err.message))
          );
        }

        // Telegram
        if (prefs.telegramChatId && prefs.telegramEnabled?.[eventType] !== false) {
          const msg = buildTelegramMessage(eventType, eventData, escrowId);
          notifyPromises.push(
            sendTelegram(prefs.telegramChatId, msg)
              .catch(err => console.error(`Telegram error for ${wallet}:`, err.message))
          );
        }
      }

      await Promise.allSettled(notifyPromises);

      // Discord admin visibility
      await notifyDiscordAdmin(eventType, escrowId, parties, eventData.chainId).catch(() => {});

      console.log(`📬 Notified [${eventType}] for ${escrowId} → ${parties.length} party(ies)`);
    } catch (err) {
      console.error("notifyParties error:", err.message);
    }
  });
}
