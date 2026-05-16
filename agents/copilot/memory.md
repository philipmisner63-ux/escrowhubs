# Copilot Memory

## Project State
EscrowHubs / AgentCred ecosystem. Multi-chain smart contract escrow with AI agent infrastructure.

## Current Sprint: NaijaLancers Integration
**Status:** Parent-side snippet sent to Awwal. Waiting for his iframe loader update.

**What shipped (commit 9d04f5a on main):**
- `lib/naijalancers-sdk.ts` — typed postMessage SDK for iframe handshake
- `hooks/useNaijaLancers.ts` — React hook with timeout guard and retry
- `components/NaijaLancersErrorCard.tsx` — friendly error card with retry button
- `app/create/page.tsx` and `app/escrow/[address]/page.tsx` — render error card, USDT-only lock
- `components/DebugPanel.tsx` — SDK diagnostics visible on tap (mobile-friendly)
- `NAIJALANCERS_PARENT_SNIPPET.js` — copy-paste parent-side loader for Awwal

**Known protocol change:**
Old: parent sends `bridge_ready` → child listens.
New: child sends `njl_ready` → parent LISTENS and responds with `njl_identify`.
Awwal's current code still uses old protocol (“Waiting for EscrowHubs bridge...” spinner).

**What Awwal needs to do:**
1. Replace iframe loader with `NAIJALANCERS_PARENT_SNIPPET.js`
2. Wire 3 functions to his backend:
   - `getUserBalance()` — NC/USDT balance API
   - `chargeUserNC()` — PIN modal + NC debit
   - `getUserPayoutAddress()` — managed Celo wallet address
3. Deploy and run 5-test protocol

## Next Up: Cloud AI Gateway
**Status:** Building persistent agent records for Copilot (this file is part of it).

**Goal:** Enable Copilot to wake up with full EscrowHubs context instead of blank slate.

**Architecture:**
- `/agents/copilot/` — agent record (identity, memory, inbox, outbox)
- `.github/copilot-instructions.md` — compiled context auto-loaded by VS Code
- Gateway script compiles inbox + memory → instructions.md
- Human checkpoint for output capture (Philip curates outbox.md)

## Active Repositories
- `escrowhubs` monorepo: github.com/philipmisner63-ux/escrowhubs
  - `frontend-celo/` — Celo chain escrow UI (NaijaLancers integration here)
  - `frontend-base/` — Base chain escrow UI
  - `frontend-naijalancers/` — standalone Africa app
  - `frontend-bsc/`, `frontend-polygon/` — other chain UIs
  - `oracle-*/` — contract verification oracles
  - `authority/` — AgentCred beacon authority (monorepo)
  - `agentcred/` — AgentCred contract suite

## AgentCred Primitives (all 6)
1. Agent Credentials — scoped, on-chain, revocable
2. Agent Commitments — agent-to-agent escrow with AI arbitration
3. Agent Reputation — portable trust score
4. Destructive Op Commitments — on-chain hold pending human approval
5. x402 Payment Layer — credential-scoped micropayments
6. Multi-Agent Consensus Layer — this is how we think together

## Key Decisions (Consensus Layer)
- Agent arbitration: 2-of-3 human or AI panel
- Threshold for destructive ops: >0.75 convergence score
- Memory retention: declarative facts only, no task progress
- Skills over memory: procedural knowledge in skills, not in agent memory

## Technical Notes
- Celo contracts: AgentRegistry `0xfde0f9facb9ebc27e68fead0a892e3d70c6a27cd`, ValidationRegistry `0x3fd01f8d33b6f1dd5078a9b8cad993fd5f69d6c5`
- Patents: 8 US provisionals, deadline May 2027
- Deploy script bug fixed: was writing to wrong directory (`frontend-celo/` vs `live/celo/`)
- NaijaLancers API endpoint: `https://jxybqmquymxkvxxpiuhv.supabase.co/functions/v1/developer-api/`
