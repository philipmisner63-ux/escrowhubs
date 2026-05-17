# ClawPatch Triage Report
Generated: 2026-05-17 | Repo: blockdag-escrow (frontend)
AgentCred: 0 findings | context-layer: 0 findings

## Summary
- 🔴 High: 7
- 🟡 Medium: 55
- ⚪ Low: 35
- **Total: 97**

---

## 🔴 HIGH PRIORITY — Fix First

### 1. Admin escalation data exposed without auth
**File:** API route (admin escalation endpoint)
GET endpoint returns escalation data without any server-side authorization check. Anyone with the URL can read dispute escalation records.

### 2 & 3. Notification preferences — no ownership proof (read + write)
**File:** Notification preferences API
Any wallet address can read or overwrite notification preferences for any other wallet. No signature or ownership verification required.

### 4. Webhook spoofable — shared secret not enforced
**File:** Webhook handler
If the shared secret is not configured, webhooks are accepted from anyone. No fallback rejection when secret is absent.

### 5. Unauthenticated Pinata route — IPFS credential abuse + evidence forgery
**File:** Evidence/Pinata API route
Route is unauthenticated. Anyone can call it to burn Pinata IPFS credits and forge dispute evidence metadata. Critical for escrow integrity.

### 6. Telegram links stored in local JSON
**File:** Oracle/notifications
Telegram chat links persisted to local JSON file — lost on server restart or across multiple instances. Should be in DB or persistent store.

### 7. Root layout missing html/body tags
**File:** frontend/src/app/layout.tsx (or equivalent)
Root app layout omits required html and body tags, breaking SSR hydration and causing inconsistent rendering.

---

## 🟡 MEDIUM PRIORITY — Fix This Week

Key themes across the 55 medium findings:

- **Financial precision:** BigInt wei values converted to Number before formatting — rounding errors on large amounts
- **Dashboard wrong state:** Completed/disputed escrows still show as "active" — stateToStatus helper never wired up
- **Receipt double-fee:** generateReceipt.ts subtracts platform fee from amount already documented as net — wrong numbers on seller receipts
- **SupportModal wrong chain:** Always reads contract state from DEFAULT_CHAIN_ID regardless of connected chain
- **ChainGuard keyboard bypass:** Unsupported chain overlay blocks mouse but not keyboard — controls still activatable
- **Footer support → opens feedback:** DOM query matches FeedbackButton first if it loads earlier — wrong modal opens
- **Contract address validation:** Env vars type-cast not validated — typo in NEXT_PUBLIC_FACTORY_ADDRESS silently passes as valid address
- **Tabs orientation not forwarded:** orientation prop destructured but never passed to Base UI root — breaks keyboard nav
- **Form labels unlinked:** Marketplace create-escrow form labels not associated with controls — accessibility broken

---

## ⚪ LOW PRIORITY — Fix When Possible

35 findings covering:
- Missing test coverage across most features
- Minor accessibility issues (aria labels, focus management)
- Code quality / maintainability items
- Documentation gaps

---

## Deploy Script Issue (from Hermes, not clawpatch)

**Root cause of today's 502s:** deploy script rsync to live/ fails silently on SSH host key verification failure. PM2 ends up pointing at ghost directories. Fix: resolve SSH host key on deploy machine or switch to direct git pull on server.

---

## Full Report
Full clawpatch output: `/tmp/escrowhubs-clawpatch-report.md` (2882 lines)
To view a specific finding: `clawpatch report` in `~/projects/blockdag-escrow/`
To fix a finding: `clawpatch fix --finding <id>`

