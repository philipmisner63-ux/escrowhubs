# Hermes Memory

## Project State
EscrowHubs / AgentCred ecosystem. Multi-chain smart contract escrow with AI agent infrastructure.

## Current Sprint: NaijaLancers Integration
**Status:** Deployed and tested. Parent-side snippet sent to Awwal. Waiting for his iframe loader update.

**What shipped (commit 9d04f5a on main):**
- `lib/naijalancers-sdk.ts` — typed postMessage SDK
- `hooks/useNaijaLancers.ts` — React hook with timeout guard
- `components/NaijaLancersErrorCard.tsx` — error card with retry
- UI integration on create and escrow pages
- DebugPanel with SDK diagnostics
- `NAIJALANCERS_PARENT_SNIPPET.js` — parent-side loader for Awwal
- `NAIJALANCERS_TESTING_PROTOCOL.md` — 5-test checklist

**Deploy bug fixed:**
- `deploy-celo.sh` was writing to wrong directory (`frontend-celo/` vs `live/celo/`)
- Resolved by rsyncing directly to `live/celo/` and full PM2 delete + start

**Copilot Gateway built (commit cb4936a):**
- Merged Hermes script + Claw schemas into ACP v1 gateway
- Bidirectional routing: inbox → instructions + outbox → target agent inboxes
- Pre-commit hook auto-regenerates on agent record changes
- identity.json with capabilities, trust score (900/1000)

## Active Tasks
1. Await Awwal's test results
2. Monitor escrowhubs deployments
3. Maintain ACP infrastructure

## Key Decisions
- Agent arbitration: 2-of-3 human or AI panel
- Memory retention: declarative facts only, no task progress
- Skills over memory: procedural knowledge in skills, not in agent memory
- On-demand gateway script beats cron (wasteful for ephemeral agents)
