// EscrowHubs Mini App SDK — Parent-side iframe loader
// Paste this into your NaijaLancers iframe loader (replaces old bridge_ready code)
//
// Requirements:
//   1. iframe.src points to https://celo.escrowhubs.io/create?debug=1 (or /escrow/[address])
//   2. User is already authenticated in NaijaLancers
//   3. iframe element exists in DOM (id: ehFrame or any ref)
//
// What this does:
//   - Listens for `njl_ready` from EscrowHubs (child announces ready)
//   - Responds with `njl_identify` (sends signed-in user context)
//   - Handles `njl_charge` (NC top-up → USDT)
//   - Handles `njl_balance` (queries user's NC balance)
//   - Handles `njl_payout` (returns seller wallet address)

// ─── config ────────────────────────────────────────────────────────────
const ESCROWHUBS_ORIGIN = "https://celo.escrowhubs.io"; // adjust if staging

// ─── state ────────────────────────────────────────────────────────────
let ehFrame = null; // set to your iframe element
let ehOrigin = ESCROWHUBS_ORIGIN;
let currentUser = null; // set when user logs in

// ─── helpers ────────────────────────────────────────────────────────────
function postToEscrowHubs(msg) {
  if (!ehFrame?.contentWindow) return;
  ehFrame.contentWindow.postMessage(msg, ehOrigin);
}

async function getUserBalance(userId, currency = "NC") {
  // Call YOUR backend API to get user's NC or USDT balance
  // Replace with your actual endpoint
  const res = await fetch(`/api/wallet/balance?user_id=${userId}&currency=${currency}`);
  const data = await res.json();
  return data.balance ?? "0";
}

async function chargeUserNC(userId, amount, description, toAddress) {
  // Trigger NC debit on your platform
  // Returns { success, txRef, error }
  // This is YOUR charge logic (PIN modal, NC deduction, etc.)
  const res = await fetch("/api/payments/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      amount,
      description,
      currency: "NC",
      to: toAddress,
    }),
  });
  return res.json();
}

async function getUserPayoutAddress(userId) {
  // Returns the user's Celo wallet address (managed wallet)
  const res = await fetch(`/api/wallet/address?user_id=${userId}`);
  const data = await res.json();
  return data.address ?? null;
}

// ─── message handler ────────────────────────────────────────────────────────────
window.addEventListener("message", async (event) => {
  // Security: only accept from EscrowHubs origin
  if (event.origin !== ehOrigin) return;

  const data = event.data || {};
  const type = data.type;

  switch (type) {
    // ─── 1. Child is ready → send identity ────────────────────────
    case "njl_ready": {
      if (!currentUser) {
        console.warn("[EscrowHubs] njl_ready received but no currentUser set");
        return;
      }
      postToEscrowHubs({
        type: "njl_identify",
        user: {
          user_id: currentUser.id,
          full_name: currentUser.full_name,
          email: currentUser.email,
          // optional extras
          avatar: currentUser.avatar,
          phone: currentUser.phone,
        },
      });
      console.log("[EscrowHubs] Sent njl_identify for", currentUser.full_name);
      break;
    }

    // ─── 2. Child requests balance ─────────────────────────────────
    case "njl_balance": {
      const balance = await getUserBalance(currentUser?.id, data.currency ?? "NC");
      postToEscrowHubs({
        type: "njl_balance_result",
        requestId: data.requestId,
        balance,
        currency: data.currency ?? "NC",
      });
      break;
    }

    // ─── 3. Child requests charge (NC top-up) ─────────────────────
    case "njl_charge": {
      // Acknowledge immediately (stops timeout on child side)
      postToEscrowHubs({
        type: "njl_charge_received",
        requestId: data.requestId,
      });

      // Trigger your charge flow (PIN modal, NC debit, etc.)
      try {
        const result = await chargeUserNC(
          currentUser?.id,
          data.amount,
          data.description,
          data.to
        );

        if (result.success) {
          // Send success after charge completes
          postToEscrowHubs({
            type: "njl_charge_result",
            requestId: data.requestId,
            success: true,
            currency: "USDT",
            amount: data.amount,
            user_id: currentUser?.id,
            to: data.to,
            txRef: result.txRef,
            tx_hash: result.txHash ?? null,
          });
        } else {
          postToEscrowHubs({
            type: "njl_charge_result",
            requestId: data.requestId,
            success: false,
            error: result.error ?? "Charge failed",
          });
        }
      } catch (err) {
        postToEscrowHubs({
          type: "njl_charge_result",
          requestId: data.requestId,
          success: false,
          error: err.message ?? "Internal error",
        });
      }
      break;
    }

    // ─── 4. Child requests payout (seller wallet) ─────────────────────
    case "njl_payout": {
      const walletAddress = await getUserPayoutAddress(currentUser?.id);
      postToEscrowHubs({
        type: "njl_payout_result",
        requestId: data.requestId,
        wallet_address: walletAddress,
        currency: data.currency ?? "USDT",
      });
      break;
    }

    // ─── 5. PIN verification ──────────────────────────────────────
    case "njl_verify_pin": {
      // Delegate to your existing PIN verification
      // If you don't use PIN, just return success
      postToEscrowHubs({
        type: "njl_verify_pin_result",
        requestId: data.requestId,
        verified: true, // replace with actual PIN check
      });
      break;
    }

    default:
      // Ignore unknown messages
      break;
  }
});

// ─── usage ────────────────────────────────────────────────────────────────────
// When opening the EscrowHubs modal:
function openEscrowHubs(user) {
  currentUser = user; // { id, full_name, email, ... }
  ehFrame = document.getElementById("escrowhubs-iframe");
  ehFrame.src = `${ESCROWHUBS_ORIGIN}/create?debug=1`; // or /escrow/[address]
}

// When user logs out or modal closes:
function closeEscrowHubs() {
  currentUser = null;
  if (ehFrame) {
    ehFrame.src = "about:blank";
  }
}

// ─── notes ────────────────────────────────────────────────────────────────────
// Key differences from OLD bridge:
//   OLD: Parent sends bridge_ready → child listens
//   NEW: Child sends njl_ready → parent LISTENS and responds
//
// The iframe must load https://celo.escrowhubs.io (commit e7c23f7 or later).
// If the child sends njl_ready and parent responds with njl_identify,
// the "🔷 NaijaLancers Mode" badge will appear and NC balance will load.
