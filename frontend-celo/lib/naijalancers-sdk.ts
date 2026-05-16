"use client";

// ─── NaijaLancers Mini App SDK ───────────────────────────────────────────────
// Typed wrapper around the postMessage protocol used by NaijaLancers iframe host.
// https://www.naijalancers.name.ng/developers
//
// Flow (child→parent):
//   njl_ready          → tell parent we are ready
//   njl_charge         → request payment (NC internal or USDT on-chain)
//   njl_balance        → query NC or USDT balance
//   njl_payout         → pay user (returns wallet for USDT)
//   njl_verify_pin     → request PIN verification
//
// Flow (parent→child):
//   njl_identify       → user identity on load
//   njl_charge_result  → payment result + txRef / tx_hash
//   njl_balance_result → balance result
//   njl_payout_result  → payout result (wallet_address for USDT)
//   njl_verify_pin_result → PIN result
//
// ACK events (reset timeout):
//   njl_charge_received, njl_charge_pending,
//   njl_payout_received, njl_payout_pending,
//   njl_verify_pin_received, njl_verify_pin_pending
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = (
  process.env.NEXT_PUBLIC_NAIJALANCERS_ORIGIN ??
  "https://www.naijalancers.name.ng,https://naijalancers.name.ng"
).split(",").map((o) => o.trim());

export interface NaijaLancersUser {
  user_id: string;
  full_name: string;
  email: string;
  profile_picture_url?: string;
}

export interface NaijaLancersChargeResult {
  success: boolean;
  currency: "NC" | "USDT";
  txRef?: string;
  user_id: string;
  to: string;
  amount: string;
  error?: string;
  requestId: string;
  duplicate?: boolean;
  tx_hash?: string; // delivered via webhook; may appear in postMessage too
}

export interface NaijaLancersBalanceResult {
  balance: string;
  currency: "NC" | "USDT";
  address?: string; // USDT only
  requestId: string;
}

export interface NaijaLancersPayoutResult {
  success: boolean;
  txRef?: string;
  error?: string;
  wallet_address?: string; // USDT only
  amount?: string;
  user?: NaijaLancersUser & {
    phone?: string;
    wallet_address?: string;
    country?: string;
  };
  requestId: string;
}

export interface NaijaLancersPinResult {
  success: boolean;
  error?: string;
  requestId: string;
}

type OutgoingMessageType =
  | "njl_ready"
  | "njl_charge"
  | "njl_balance"
  | "njl_payout"
  | "njl_verify_pin";

type IncomingMessageType =
  | "njl_identify"
  | "njl_charge_result"
  | "njl_charge_received"
  | "njl_charge_pending"
  | "njl_balance_result"
  | "njl_payout_result"
  | "njl_payout_received"
  | "njl_payout_pending"
  | "njl_verify_pin_result"
  | "njl_verify_pin_received"
  | "njl_verify_pin_pending";

interface OutgoingMessage {
  type: OutgoingMessageType;
  requestId?: string;
  amount?: number | string;
  description?: string;
  charge_type?: "one_time" | "subscription" | "tip" | "purchase";
  currency?: "NC" | "USDT";
  to?: string;
  reason?: string;
}

interface IncomingMessage {
  type: IncomingMessageType;
  user?: NaijaLancersUser;
  requestId?: string;
  // charge result fields
  success?: boolean;
  currency?: "NC" | "USDT";
  txRef?: string;
  user_id?: string;
  to?: string;
  amount?: string;
  error?: string;
  duplicate?: boolean;
  tx_hash?: string;
  // balance result fields
  balance?: string;
  address?: string;
  // payout result fields
  wallet_address?: string;
  // pin result fields
}

// ─── state ────────────────────────────────────────────────────────────────────

let _parentOrigin: string | null = null;
let _listeners: {
  requestId: string;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}[] = [];

// ─── diagnostic state (exposed for DebugPanel) ───────────────────────────────
let _diag = {
  lastSent: null as { type: string; time: string } | null,
  lastReceived: null as { type: string; time: string; data?: unknown } | null,
  identityReceived: false,
  handshakeComplete: false,
  chargePending: false,
  lastError: null as string | null,
};

export function getSdkDiagnostics() {
  return { ..._diag };
}

function _detectOrigin(): string | null {
  if (_parentOrigin) return _parentOrigin;
  if (typeof window === "undefined") return null;
  try {
    if (window.parent === window) return null;
    // Try to infer from referrer or document.referrer
    const ref = document.referrer;
    if (ref) {
      const url = new URL(ref);
      const origin = url.origin;
      if (ALLOWED_ORIGINS.includes(origin)) {
        _parentOrigin = origin;
        return origin;
      }
    }
  } catch {
    // cross-origin access throws
  }
  return null;
}

function _send(msg: OutgoingMessage) {
  if (typeof window === "undefined") return;
  _diag.lastSent = { type: msg.type, time: new Date().toISOString() };
  const origin = _detectOrigin() ?? ALLOWED_ORIGINS[0];
  window.parent.postMessage(msg, origin);
}

function _generateRequestId(prefix = "req"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function _startListener<T>(
  requestId: string,
  timeoutMs: number,
  ackTypes: string[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      _listeners = _listeners.filter((l) => l.requestId !== requestId);
      _diag.lastError = `Request ${requestId} timed out (${timeoutMs}ms)`;
      reject(new Error(`NaijaLancers request timed out (${timeoutMs}ms)`));
    }, timeoutMs);

    const slot = {
      requestId,
      resolve: (value: unknown) => {
        clearTimeout(timeoutId);
        _listeners = _listeners.filter((l) => l.requestId !== requestId);
        resolve(value as T);
      },
      reject: (reason?: unknown) => {
        clearTimeout(timeoutId);
        _listeners = _listeners.filter((l) => l.requestId !== requestId);
        reject(reason);
      },
      timeoutId,
    };

    _listeners.push(slot);

    // Extend timeout on ACK events
    const ackHandler = (event: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      const data = event.data as IncomingMessage;
      if (!data?.type || !ackTypes.includes(data.type)) return;
      if (data.requestId !== requestId) return;
      clearTimeout(timeoutId);
      // Reset timeout from now: 5 minutes after last ACK
      const newTimeout = setTimeout(() => {
        _listeners = _listeners.filter((l) => l.requestId !== requestId);
        reject(new Error("NaijaLancers request timed out after ACK"));
      }, 300_000);
      slot.timeoutId = newTimeout;
    };

    window.addEventListener("message", ackHandler);
    // Clean up ack handler when promise settles
    const cleanup = () => window.removeEventListener("message", ackHandler);
    Promise.resolve().then(() => {
      // attach cleanup to the same resolve/reject path
      const origResolve = slot.resolve;
      const origReject = slot.reject;
      slot.resolve = (v: unknown) => { cleanup(); origResolve(v); };
      slot.reject = (r?: unknown) => { cleanup(); origReject(r); };
    });
  });
}

function _handleMessage(event: MessageEvent) {
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;
  const data = event.data as IncomingMessage;
  if (!data?.type) return;

  // Capture origin for replies
  if (!_parentOrigin) _parentOrigin = event.origin;

  _diag.lastReceived = {
    type: data.type,
    time: new Date().toISOString(),
    data,
  };
  if (data.type === "njl_identify") {
    _diag.identityReceived = true;
    _diag.handshakeComplete = true;
  }

  // Resolve only the listener whose requestId matches
  if (data.requestId) {
    const slot = _listeners.find((l) => l.requestId === data.requestId);
    if (slot) {
      slot.resolve(data);
    }
  }
}

let _handlerAttached = false;
function _ensureHandler() {
  if (_handlerAttached) return;
  if (typeof window === "undefined") return;
  window.addEventListener("message", _handleMessage);
  _handlerAttached = true;
}

// ─── public API ───────────────────────────────────────────────────────────────

/** True when running inside a NaijaLancers iframe */
export function isNaijaLancersMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

/** Signal readiness to the NaijaLancers parent */
export function sendReady() {
  _ensureHandler();
  _send({ type: "njl_ready" });
}

/** Request a charge. For USDT, `to` is the destination 0x address. */
export function charge(opts: {
  amount: number;
  description: string;
  chargeType?: "one_time" | "subscription" | "tip" | "purchase";
  currency?: "NC" | "USDT";
  to?: string;
  requestId?: string;
}): Promise<NaijaLancersChargeResult> {
  _ensureHandler();
  _diag.chargePending = true;
  _diag.lastError = null;
  const requestId = opts.requestId ?? _generateRequestId("chg");
  _send({
    type: "njl_charge",
    requestId,
    amount: opts.amount,
    description: opts.description,
    charge_type: opts.chargeType ?? "purchase",
    currency: opts.currency ?? "NC",
    to: opts.to,
  });

  return _startListener<NaijaLancersChargeResult>(
    requestId,
    300_000, // 5 min base timeout
    ["njl_charge_received", "njl_charge_pending"]
  ).finally(() => {
    _diag.chargePending = false;
  });
}

/** Query user balance (NC or USDT) */
export function getBalance(opts: {
  currency?: "NC" | "USDT";
  requestId?: string;
}): Promise<NaijaLancersBalanceResult> {
  _ensureHandler();
  const requestId = opts.requestId ?? _generateRequestId("bal");
  _send({
    type: "njl_balance",
    requestId,
    currency: opts.currency ?? "NC",
  });

  return _startListener<NaijaLancersBalanceResult>(
    requestId,
    30_000,
    []
  );
}

/** Request a payout. For USDT this returns the user's wallet address. */
export function payout(opts: {
  amount: number;
  description: string;
  currency?: "NC" | "USDT";
  requestId?: string;
}): Promise<NaijaLancersPayoutResult> {
  _ensureHandler();
  const requestId = opts.requestId ?? _generateRequestId("po");
  _send({
    type: "njl_payout",
    requestId,
    amount: opts.amount,
    description: opts.description,
    currency: opts.currency ?? "NC",
  });

  return _startListener<NaijaLancersPayoutResult>(
    requestId,
    300_000,
    ["njl_payout_received", "njl_payout_pending"]
  );
}

/** Request PIN verification */
export function verifyPin(opts: {
  reason: string;
  requestId?: string;
}): Promise<NaijaLancersPinResult> {
  _ensureHandler();
  const requestId = opts.requestId ?? _generateRequestId("pin");
  _send({
    type: "njl_verify_pin",
    requestId,
    reason: opts.reason,
  });

  return _startListener<NaijaLancersPinResult>(
    requestId,
    120_000,
    ["njl_verify_pin_received", "njl_verify_pin_pending"]
  );
}

/** Subscribe to identity events */
export function onIdentify(
  cb: (user: NaijaLancersUser) => void
): () => void {
  _ensureHandler();
  const handler = (event: MessageEvent) => {
    if (!ALLOWED_ORIGINS.includes(event.origin)) return;
    const data = event.data as IncomingMessage;
    if (data.type === "njl_identify" && data.user) {
      cb(data.user);
    }
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

export { ALLOWED_ORIGINS };
