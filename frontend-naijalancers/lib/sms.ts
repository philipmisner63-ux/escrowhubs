import AfricasTalking from "africastalking";

const AT_USERNAME = process.env.AT_USERNAME ?? "";
const AT_API_KEY = process.env.AT_API_KEY ?? "";
const AT_SANDBOX = process.env.AT_SANDBOX === "true";

let atClient: ReturnType<typeof AfricasTalking> | null = null;

function getClient() {
  if (!AT_USERNAME || !AT_API_KEY) {
    console.warn("[SMS] Africa's Talking credentials not configured");
    return null;
  }
  if (!atClient) {
    atClient = AfricasTalking({
      username: AT_USERNAME,
      apiKey: AT_API_KEY,
    });
  }
  return atClient;
}

function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, "").replace(/^0/, "+234");
  if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;
  // If it already starts with +, keep it
  if (/^\+/.test(phone.replace(/\s/g, ""))) {
    const p = phone.replace(/\s/g, "");
    if (/^\+\d{10,15}$/.test(p)) return p;
  }
  return null;
}

/**
 * Send an SMS via Africa's Talking.
 * Never throws. Logs errors but never blocks the caller.
 */
export async function sendSms(
  to: string | null | undefined,
  message: string
): Promise<{ sent: boolean; error?: string }> {
  const phone = formatPhone(to);
  if (!phone) {
    console.log("[SMS] No valid phone number, skipping");
    return { sent: false };
  }

  const client = getClient();
  if (!client) {
    console.log("[SMS] AT client not available, skipping");
    return { sent: false };
  }

  try {
    const sms = client.SMS;
    const result = await sms.send({
      to: [phone],
      message,
      from: AT_SANDBOX ? undefined : AT_USERNAME,
    });
    console.log("[SMS] Sent to", phone, "result:", JSON.stringify(result));
    return { sent: true };
  } catch (err: any) {
    console.error("[SMS] Failed to send:", err?.message || err);
    return { sent: false, error: err?.message };
  }
}
