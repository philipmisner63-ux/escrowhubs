import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

// Encryption key from server-side env — never exposed to client
const KEY = process.env.WALLET_SEED ||
  (() => { throw new Error("WALLET_SEED not set"); })();

// Derive a 32-byte key from WALLET_SEED using PBKDF2
function getKey(): Buffer {
  return pbkdf2Sync(KEY, "escrowhubs_salt_2026", 100000, 32, "sha256");
}

/**
 * Encrypt a private key (hex string, 0x... or raw hex) → hex string with salt
 */
export function encryptPrivateKey(privateKeyHex: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(privateKeyHex, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  // Store: iv (32 hex) + authTag (32 hex) + ciphertext
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

/**
 * Decrypt a private key stored by encryptPrivateKey → hex string
 */
export function decryptPrivateKey(encryptedHex: string): string {
  const key = getKey();
  const iv = Buffer.from(encryptedHex.slice(0, 32), "hex");
  const authTag = Buffer.from(encryptedHex.slice(32, 64), "hex");
  const ciphertext = encryptedHex.slice(64);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
