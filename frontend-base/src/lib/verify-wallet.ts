import { recoverMessageAddress } from "viem";

const AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify that a wallet address signed an expected message.
 * @returns true if signature recovers to the claimed wallet address
 */
export async function verifyWalletSignature(
  wallet: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    return recovered.toLowerCase() === wallet.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Check that a timestamp is within the allowed auth window (default 5 min).
 */
export function isTimestampValid(ts: number, windowMs = AUTH_WINDOW_MS): boolean {
  const now = Date.now();
  return Math.abs(now - ts) <= windowMs;
}

/**
 * Build a standard auth message for EscrowHubs API actions.
 */
export function buildAuthMessage(
  action: string,
  wallet: string,
  timestamp: number
): string {
  return `EscrowHubs API Auth\nAction: ${action}\nWallet: ${wallet}\nTimestamp: ${timestamp}`;
}
