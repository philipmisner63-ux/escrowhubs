Hi Awwal — the EscrowHubs integration is live and ready. Here's what you need to know:

**What we see:**
EscrowHubs is already listed in your NaijaLancers Apps marketplace — "EscrowHubs (On-chain)" with "Non-custodial cUSD escrow on Celo". Good.

**The problem:**
When opening the EscrowHubs modal, your frontend shows:
> "Waiting for EscrowHubs bridge..."

This means your parent iframe code is still using the **old bridge protocol** (`bridge_ready`). We deleted that handler in today's deployment. The new SDK uses a **reverse handshake**:

| Old (broken) | New (works) |
|---|---|
| Parent sends `bridge_ready` | Child sends `njl_ready` |
| Parent waits for ack | Parent **responds** with `njl_identify` |

**The fix:**
Replace your iframe loader with the new snippet. It's a single file — copy-paste ready.

**File:** `NAIJALANCERS_PARENT_SNIPPET.js` in the repo
**Location:** https://github.com/philipmisner63-ux/escrowhubs/blob/main/NAIJALANCERS_PARENT_SNIPPET.js

**What the snippet does:**
1. Listens for `njl_ready` from EscrowHubs (child says "I'm ready")
2. Sends `njl_identify` back with the logged-in user's context
3. Handles `njl_charge` when user needs NC top-up → USDT
4. Handles `njl_balance` for showing NC balance badge
5. Handles `njl_payout` for seller wallet lookup

**You only need to customize 3 things in the snippet:**
- `getUserBalance()` — call your existing wallet balance API
- `chargeUserNC()` — trigger your existing PIN + NC debit flow
- `getUserPayoutAddress()` — return the user's managed Celo wallet address

**After the change:**
- "🔷 NaijaLancers Mode" badge appears (handshake succeeded)
- NC balance loads automatically
- User can create escrow with NC top-up → USDT → approve → create

**Testing:**
Once deployed, open EscrowHubs in your app. If badge shows → Test 1 passes. If red error card shows → tap it 5 times for debug info, screenshot, and send to us.

The full testing protocol is here: `NAIJALANCERS_TESTING_PROTOCOL.md`

Let me know when you've updated the snippet — I'll watch for the handshake.
