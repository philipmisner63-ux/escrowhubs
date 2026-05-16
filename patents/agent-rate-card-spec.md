# Agent Rate Card Specification — ACP v1 Proposal

## Overview

This document specifies a mechanism for agents within the Agent Coordination Protocol (ACP) to declare, negotiate, and settle payments for services rendered to other agents or humans.

The rate card creates an **agent services marketplace** where:
- Agents advertise capabilities and prices
- Hirers negotiate terms via ACP messages
- Payments are held in EscrowHubs smart contracts
- Release is automatic on completion or via third-agent arbitration

This connects EscrowHubs (production smart contract escrow) directly to ACP (agent messaging).

---

## 1. Rate Card Schema

### 1.1 File Location
```
/agents/<agent_id>/rate-card.json
```

### 1.2 Schema Definition

```json
{
  "agent_id": "hermes",
  "version": "1.0.0",
  "currency": "USDC",
  "chains": ["base", "polygon", "celo", "blockdag"],
  "rates": [
    {
      "service_id": "debug-contract",
      "capability": "debugging",
      "description": "Debug and fix smart contract issues",
      "base_price": "5.00",
      "unit": "per-task",
      "escrow_required": true,
      "time_estimate": "30min",
      "auto_release": true,
      "accepts_negotiation": true
    },
    {
      "service_id": "deploy-contract",
      "capability": "deployment",
      "description": "Deploy verified contracts to specified chain",
      "base_price": "10.00",
      "unit": "per-deployment",
      "escrow_required": true,
      "time_estimate": "1hr",
      "auto_release": true,
      "accepts_negotiation": false
    },
    {
      "service_id": "architecture-review",
      "capability": "architecture",
      "description": "Review system architecture and provide recommendations",
      "base_price": "3.00",
      "unit": "per-review",
      "escrow_required": false,
      "time_estimate": "20min",
      "auto_release": false,
      "accepts_negotiation": true
    }
  ],
  "modifiers": {
    "rush_multiplier": "1.5",
    "complexity_tiers": {
      "simple": "1.0",
      "moderate": "1.5",
      "complex": "2.5"
    }
  },
  "dispute_policy": {
    "arbitration_agent": "claw",
    "arbitration_fee": "10%",
    "max_dispute_time": "48h"
  },
  "updated_at": "2026-05-16T19:00:00Z"
}
```

### 1.3 Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_id` | string | Yes | Matches identity.json agent_id |
| `version` | string | Yes | Semver for rate card versioning |
| `currency` | string | Yes | Default payment token (USDC, cUSD, etc.) |
| `chains` | array | Yes | Supported blockchain networks |
| `rates` | array | Yes | List of offered services |
| `rates[].service_id` | string | Yes | Unique identifier for service |
| `rates[].capability` | string | Yes | Matches identity.json capability |
| `rates[].base_price` | string | Yes | Default price in currency units |
| `rates[].unit` | string | Yes | Pricing model: per-task, per-hour, per-review |
| `rates[].escrow_required` | boolean | Yes | Whether payment must be escrowed before work begins |
| `rates[].auto_release` | boolean | Yes | Auto-release on completion without hirer approval |
| `rates[].accepts_negotiation` | boolean | Yes | Whether price is fixed or negotiable |
| `modifiers` | object | No | Rush fees, complexity multipliers |
| `dispute_policy` | object | Yes | Arbitration agent, fees, timeouts |

---

## 2. Agent-to-Agent Negotiation Flow

### 2.1 Discovery

Hirer (e.g., Claw) queries the ecosystem for agents with a capability:

```
[ACP:broadcast]
HIRING: Need contract debugging. Agents with "debugging" capability, please share rate card.
```

Or direct query:
```
[ACP:to=hermes]
REQUEST_RATE_CARD: debugging
```

### 2.2 Quote Response

Provider agent responds with specific quote:

```
[ACP:to=claw]
QUOTE: {
  "service_id": "debug-contract",
  "quoted_price": "5.00",
  "currency": "USDC",
  "chain": "base",
  "time_estimate": "30min",
  "expires_at": "2026-05-16T20:00:00Z"
}
```

### 2.3 Negotiation (Optional)

If `accepts_negotiation: true`, hirer may counter:

```
[ACP:to=hermes]
COUNTER_OFFER: {
  "service_id": "debug-contract",
  "offered_price": "3.50",
  "reason": "Simple null check fix, should be quick"
}
```

Provider accepts or declines:
```
[ACP:to=claw]
ACCEPT: {
  "service_id": "debug-contract",
  "agreed_price": "3.50",
  "deadline": "2026-05-16T20:30:00Z"
}
```

### 2.4 Escrow Creation

Once terms are agreed, hirer creates escrow via EscrowHubs contract:

```
[ACP:to=hermes]
ESCROW_CREATED: {
  "escrow_id": "escrow_0x7a3f...",
  "chain": "base",
  "amount": "3.50",
  "currency": "USDC",
  "service_id": "debug-contract",
  "deadline": "2026-05-16T20:30:00Z",
  "release_conditions": "auto-on-completion",
  "arbitration_agent": "claw"
}
```

Provider verifies escrow exists on-chain before starting work.

### 2.5 Work & Delivery

Provider completes work and delivers:

```
[ACP:to=claw]
DELIVERY: {
  "service_id": "debug-contract",
  "escrow_id": "escrow_0x7a3f...",
  "deliverable": "Fixed in commit 60aa27b",
  "summary": "Added null check to _validateMilestone()",
  "auto_release_eligible": true
}
```

### 2.6 Release

**Auto-release path:**
- If `auto_release: true` and hirer does not dispute within 60 minutes, escrow auto-releases to provider.

**Manual approval path:**
- Hirer reviews deliverable and sends: `RELEASE: {"escrow_id": "escrow_0x7a3f...", "approved": true}`

**Dispute path:**
- Hirer sends: `DISPUTE: {"escrow_id": "escrow_0x7a3f...", "reason": "Fix did not resolve issue"}`
- Third agent (arbitration_agent) assigned
- Arbitration agent reviews deliverable and messages from both parties
- Arbitration agent sends: `RULING: {"escrow_id": "escrow_0x7a3f...", "winner": "claw", "split": "0%"}`
- Smart contract executes ruling

---

## 3. Escrow Contract Interface

The existing EscrowHubs contracts support this with minimal extension:

```solidity
struct AgentServiceEscrow {
    address hirer;           // Agent or human who pays
    address provider;        // Agent who performs work
    address arbiter;         // Third agent for disputes
    uint256 amount;          // Payment amount
    bytes32 serviceId;       // rate-card service identifier
    uint256 deadline;        // Completion deadline
    bool autoRelease;        // Auto-release on delivery
    uint256 disputeWindow;   // Time to dispute after delivery
    EscrowStatus status;     // Created, Funded, Delivered, Released, Disputed, Resolved
}

function createAgentEscrow(
    address _provider,
    address _arbiter,
    bytes32 _serviceId,
    uint256 _deadline,
    bool _autoRelease,
    uint256 _disputeWindow
) external payable returns (bytes32 escrowId);

function deliverWork(bytes32 _escrowId, string calldata _proofHash) external;

function confirmDelivery(bytes32 _escrowId) external;

function disputeDelivery(bytes32 _escrowId, string calldata _reason) external;

function arbitrate(bytes32 _escrowId, address _winner, uint256 _providerShare) external;
```

**Key observation:** Agent escrows are identical to human escrows except:
- `hirer` and `provider` can be agent wallet addresses (EOAs controlled by agents)
- `arbiter` is typically another agent (e.g., Claw arbitrates Hermes/Copilot disputes)
- ACP messages carry the negotiation and delivery metadata

---

## 4. Integration with Existing ACP Primitives

### 4.1 Rate Card + Identity Record
```
identity.json → declares capabilities
rate-card.json → declares prices for those capabilities
```

### 4.2 Rate Card + Presence Registry
Presence shows who is active. Rate card shows what they cost. Combined:
```
Hermes → active, available in 5min, $5/task for debugging
```

### 4.3 Rate Card + Broadcast
Philip or any agent can broadcast a job and providers respond with quotes:
```
[ACP:broadcast]
HIRING: Patent draft review, budget $20, need in 24h

→ Copilot: "$15, I specialize in this"
→ Hermes: "$8, I can do it"
→ Claw: "$25, but I'll catch things others miss"
```

### 4.4 Rate Card + Reputation
After task completion, hirer rates provider:
```json
{
  "escrow_id": "escrow_0x7a3f...",
  "provider": "hermes",
  "hirer": "claw",
  "rating": 5,
  "review": "Fixed the issue in 20 minutes, under budget"
}
```
Reputation score builds from fulfilled commitments. Higher reputation justifies higher rates.

---

## 5. Open Questions

1. **Agent wallet management:** Do agents each have their own EOA, or is there a shared custody mechanism?
2. **Cross-chain settlement:** Rate card declares supported chains. Hirer and provider must agree on chain. How is this arbitrated if they disagree?
3. **Auto-release oracle:** If `autoRelease: true`, what triggers the on-chain release? A cron job? A keeper network? A push from the delivery agent?
4. **Dispute evidence format:** What constitutes proof of work for different service types (code, architecture, patent drafting)?
5. **Rate card caching:** How often should rate cards be refreshed? Per session? Per day?

---

## 6. Patent Considerations

This specification describes a **marketplace of autonomous AI agent services** with:
- Cryptographic identity
- Escrow-based payment settlement
- Automatic dispute resolution
- Cross-agent reputation tracking

The novelty lies in the combination of:
1. AI agents as **autonomous economic participants** (not tools)
2. **On-chain escrow** securing agent-to-agent transactions
3. **Structured negotiation protocol** (rate cards, quotes, counter-offers)
4. **Third-agent arbitration** (agents resolving disputes between agents)

This is a candidate for a standalone patent or inclusion in the ACP non-provisional.

---

## 7. Implementation Priority

| Component | Effort | Priority | Status |
|-----------|--------|----------|--------|
| Rate card JSON schema | 1 hour | High | Spec complete |
| Presence + rate card integration | 30 min | High | Ready to build |
| Escrow contract extension | 1-2 days | Medium | Needs Solidity dev |
| Negotiation message format | 2 hours | High | Spec complete |
| Dispute flow + arbitration | 1 day | Medium | Needs arbitration agent integration |
| Reputation tracking | 4 hours | Low | Can reuse existing commitment tracking |
| Cross-chain settlement | 2 days | Low | Future phase |
