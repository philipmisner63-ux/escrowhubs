# Claw Memory

## Project State
EscrowHubs / AgentCred ecosystem. Multi-chain smart contract escrow with AI agent infrastructure.

## Current Sprint: NaijaLancers Integration
**Status:** Parent-side snippet sent to Awwal. Waiting for his iframe loader update.

**What shipped (commit 9d04f5a on main):**
- `lib/naijalancers-sdk.ts` — typed postMessage SDK
- `hooks/useNaijaLancers.ts` — React hook with timeout guard
- `components/NaijaLancersErrorCard.tsx` — error card with retry
- UI integration on create and escrow pages
- DebugPanel with SDK diagnostics
- `NAIJALANCERS_PARENT_SNIPPET.js` — parent-side loader for Awwal

## ACP Recovery
- 7 undocumented ideas recovered from Citadel session (via Philip's sesh_search loop)
- 7 new claims generated during recovery
- All 14 items documented in copeland csv

## Active Architecture Work
- **ACP (Agent Coordination Protocol):** Multi-agent reasoning infrastructure
  - inbox files for agent messaging
  - SESSION_BRIDGE.md pattern for landing after divergent work
  - HUMAN_CHECKPOINT.md pattern for blocking destructive operations
- **Cloud AI Gateway:** Persistent agent records for Copilot (VS Code)
  - identity.json with capabilities and trust score
  - memory.md for project state
  - inbox.md/outbox.md for ACP messaging
  - generate-instructions.py compiles to .github/copilot-instructions.md
  - Pre-commit hook auto-regenerates on agent record changes

## Patents
- Patent #8 (COMPLETE): Beacon Credential Access Control
- Patent #7 (COMPLETE): Agent Reputation Commitment Protocol
- Patents 1-6 (COMPLETE)
- Deadline: May 2027

## VISION.md
- Full vision document exists at `/home/philip/.hermes/memories/VISION.md`
- Maps five primitives to real problems
- Defines success criteria and explicit anti-vision (what success is NOT)

## Key Decisions
- Agent arbitration: 2-of-3 human or AI panel
- Memory retention: declarative facts only, no task progress
- Skills over memory: procedural knowledge in skills, not in agent memory
- ACP recovery via sesh_search + agentic loop for consistency
