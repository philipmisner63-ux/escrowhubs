# NaijaLancers x EscrowHubs Integration — Testing Protocol

**Status:** SDK built, build passes. Needs live iframe handshake verification before production use.
**Commit:** `c3b0def` on `main`
**Deploy target:** `celo.escrowhubs.io`

---

## Prerequisites

Before testing, ensure:

1. `celo.escrowhubs.io` is deployed with commit `c3b0def` or later.
2. Awwal's app (NaijaLancers) embeds the iframe pointing to `https://celo.escrowhubs.io/create`.
3. The user's NaijaLancers wallet has a small NC balance (even NC 100 is enough for probing).
4. A test wallet with some Celo gas (for signing transactions) is connected inside the iframe.

---

## Test 1: Handshake (Identity + Balance)

**Purpose:** Verify the iframe can talk to NaijaLancers parent.

**Steps:**
1. Open NaijaLancers app.
2. Navigate to the EscrowHubs mini-app section.
3. Open browser DevTools (Chrome: F12 → Console tab).
4. Look for these console messages from `celo.escrowhubs.io`:
   - `[NaijaLancers SDK] Sent njl_ready`
   - `[NaijaLancers SDK] Identity received: { user_id, full_name, email }`
   - `[NaijaLancers SDK] Balance received: X NC`
5. On the EscrowHubs UI, confirm you see:
   - Badge: "💎 NaijaLancers Mode"
   - NC Balance displayed (e.g., `NC Balance: 2,041.23`)

**Expected result:** Badge and balance load within 3 seconds. No red error card appears.

**If it fails:**
- Screenshot the console (F12 → right-click → Save as...).
- Check if `njl_identify` was sent by parent. If not, the iframe may not be in the allowlist.
- Verify the iframe origin is `https://www.naijalancers.name.ng` or `https://naijalancers.name.ng`.

---

## Test 2: Create Escrow with Top-Up (USDT)

**Purpose:** Verify `njl_charge` + on-chain escrow creation works end-to-end.

**Preconditions:**
- User's wallet has **less** than the test amount in USDT (so top-up triggers).
- User has enough NC balance to cover the charge.

**Steps:**
1. In EscrowHubs (inside NaijaLancers iframe), go to **Create Payment**.
2. Token selector should show **USDT only** (cUSD is hidden in iframe mode).
3. Enter:
   - Recipient: a test wallet address (or a phone number that resolves to one)
   - Amount: small value (e.g., 0.5 or 1.0)
   - Description: `Test escrow via NaijaLancers`
4. Tap **Create Payment**.
5. If USDT balance is insufficient, EscrowHubs sends `njl_charge` to NaijaLancers.
6. **Expected:** NaijaLancers PIN modal appears. Enter PIN.
7. Wait for charge confirmation.
8. **Expected:** Wallet prompt appears for token `approve` (Step 1/2). Confirm.
9. **Expected:** Second wallet prompt appears for `createSimpleEscrow` (Step 2/2). Confirm.
10. **Expected:** Success screen with escrow address and share link.

**Verification:**
- Copy the escrow address.
- Open `https://celoscan.io/address/{escrowAddress}` — verify it exists and shows the correct amount + beneficiary.

**If it fails:**
- Screenshot the exact step where it stops.
- Copy the red error text from the UI.
- Open browser console (F12) and copy any red error lines.
- Note whether the PIN dialog appeared, and whether the wallet prompt appeared.

---

## Test 3: Seller Settlement Wallet Display

**Purpose:** Verify `njl_payout` probe returns the correct wallet address on escrow detail.

**Preconditions:**
- An escrow exists where the current user is the **beneficiary** (not the depositor).
- User is viewing the escrow inside the NaijaLancers iframe.

**Steps:**
1. In EscrowHubs, navigate to an escrow where you are the beneficiary.
2. Look below the status card.

**Expected result:**
- A blue box titled **"Settlement Wallet"**
- Shows the user's USDT wallet address (full address, monospaced)
- Subtitle: "Funds will be sent to this wallet when released."

**If it fails:**
- Screenshot the escrow detail page.
- Check console for `[NaijaLancers SDK] payout response` or error.
- Verify the user has a wallet address in NaijaLancers system.

---

## Test 4: Error Recovery

**Purpose:** Verify the error card appears and retry works when connection drops.

**Steps:**
1. Open EscrowHubs inside NaijaLancers iframe (Test 1 state).
2. **Simulate failure:** Turn off mobile data / disconnect WiFi for 10 seconds.
3. Observe the UI.

**Expected result:**
- Red error card appears: "Unable to connect to NaijaLancers. Please check your connection and retry."
- Tap **Retry Connection**.
- Reconnect internet.
- **Expected:** Badge and balance reload successfully.

---

## Test 5: Release Flow (Full End-to-End)

**Purpose:** Verify depositor can release funds and beneficiary receives USDT.

**Preconditions:**
- Escrow from Test 2 is in **FUNDED** state (depositor view).
- Beneficiary has viewed the escrow and confirmed the settlement wallet address (Test 3).

**Steps:**
1. Depositor opens the escrow detail page.
2. Tap **Release Funds**.
3. Confirm in wallet.
4. Beneficiary refreshes the escrow page.

**Expected result:**
- Escrow state changes to **RELEASED**.
- Beneficiary's USDT wallet receives the escrowed amount (minus protocol fee).
- On Celoscan, `release()` transaction is visible.

**Fee note:** Protocol fee is 0.5% (50 bps). A 1.0 USDT escrow sends 0.995 USDT to beneficiary.

---

## Console Debug (For Developers)

If any test fails, Awwal or Philip should:
1. Open browser console (F12).
2. Look for messages prefixed with `[NaijaLancers SDK]`.
3. Copy the full error text (red lines).
4. Note the step number from this protocol.
5. Share screenshot + console log in Telegram/WhatsApp.

**Also:** Append `?debug=1` to the URL for extra diagnostics:
```
https://celo.escrowhubs.io/create?debug=1
```
This shows a debug overlay with chain ID, wallet type, RPC status, and account.

**On mobile (no F12):**
Tap the **top header area (logo) 5 times in 3 seconds** to open the debug overlay. When running inside the NaijaLancers iframe, the overlay shows an extra **SDK** section with:
- **Handshake:** `✓ ready` / `waiting…` / `not sent`
- **Identity:** `✓ received` / `--`
- **Last sent:** most recent postMessage type + timestamp
- **Last rcvd:** most recent parent response type + timestamp
- **Charge:** `⏳ pending` / `idle`
- **Last err:** red text if anything failed

This replaces the need for browser console on mobile.

---

## Known Limitations (Current Build)

| Limitation | Impact | Workaround |
|---|---|---|
| Token selector locked to USDT in iframe mode | Cannot escrow cUSD via NaijaLancers | By design — NaijaLancers SDK only supports USDT on-chain |
| Requires connected wallet (MetaMask/MiniPay) inside iframe | User must have a wallet | By design — Awwal confirmed "anyone with crypto wallet" |
| `njl_charge` sends USDT to the wallet; user must still `approve` + `create` | Two wallet signatures after charge | UX is 2-step: top-up then create. Cannot be avoided without contract changes. |
| No auto-refresh after release | Beneficiary must manually refresh to see RELEASED state | Manual refresh or re-open page |

---

## Sign-Off Checklist

- [ ] Test 1: Handshake passes (badge + balance loads)
- [ ] Test 2: Create escrow with top-up succeeds
- [ ] Test 3: Settlement wallet displays correctly
- [ ] Test 4: Error recovery works
- [ ] Test 5: Release flow completes end-to-end
- [ ] All console errors documented (if any)

**After all checks pass:** EscrowHubs is ready for NaijaLancers production traffic.

---

*Document generated: Saturday, May 16, 2026*
*Contact: Philip (EscrowHubs) + Awwal (NaijaLancers)*
