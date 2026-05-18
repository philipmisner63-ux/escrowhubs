# Copilot Task — Rate Card Patent Final Pass
Date: 2026-05-17

## Your Job

1. Add Claims 11-14 (listed below) to the draft
2. Tighten Claim 1 — make autonomous AI execution WITHOUT human intermediation explicit and unambiguous
3. Check for self-collision with Patents #1-6 (EscrowHubs/AgentCred prior provisionals) on escrow + AI arbitration — flag if Claim 1 overlaps our own prior art
4. Flag any prior art Hermes missed
5. Output a complete final revised draft ready to send to the attorney

---

## THE DRAFT (Claw)

### Title
System and Method for Autonomous Agent Service Discovery, Negotiation, and Escrow-Secured Settlement Using Structured Rate Cards

### Inventor
Philip Misner, 919 North Madelia Street, Spokane, WA 99202

### Date of Conception
2026-05-16

---

### FIELD OF THE INVENTION

This invention relates to autonomous artificial intelligence agents, and more particularly to a system and method enabling AI agents to discover, negotiate, and autonomously settle payments for services rendered between agents using structured rate card declarations, a cryptographic negotiation protocol, and on-chain escrow-secured payment contracts.

---

### BACKGROUND

Artificial intelligence agents are increasingly capable of performing complex tasks autonomously — writing code, reviewing contracts, deploying infrastructure, conducting research, and executing financial transactions. As agents become more capable, demand for agent-to-agent economic coordination is growing: one agent may need to hire another agent to perform a specialized task.

Existing approaches fail to address this market:

1. **Human intermediation is required.** Current agent systems require a human to approve, fund, and settle every inter-agent transaction. This eliminates the autonomy benefit and does not scale.

2. **No standardized pricing mechanism exists.** There is no standard for agents to advertise their capabilities, prices, availability, or terms. Discovery of what an agent will do and what it costs requires unstructured, ad hoc communication.

3. **Payment is not secured.** If one agent performs work for another, there is no trustless mechanism to guarantee payment upon delivery. Agents cannot verify that funds are available before beginning work.

4. **Dispute resolution is undefined.** When agent-delivered work is disputed, no mechanism exists for a neutral third party (whether human or another agent) to resolve the dispute and execute a binding payment ruling.

5. **Reputation is not portable.** An agent that successfully completes transactions has no on-chain, portable record of that history that other agents can independently verify.

What is needed is a system that allows AI agents to operate as autonomous economic participants — declaring their services and prices, negotiating terms, securing payment in escrow before work begins, delivering proof of work, and resolving disputes without human intervention.

---

### SUMMARY OF THE INVENTION

The present invention provides a system and method for autonomous AI agent economic coordination comprising:

- A **Rate Card Schema**: a structured, versioned, machine-readable document published by each agent declaring its offered services, prices, pricing models, supported currencies, supported blockchain networks, negotiation policies, and dispute resolution terms.

- A **Service Discovery Protocol**: a broadcast and direct-query mechanism by which agents discover other agents' rate cards and capabilities within a communication network.

- A **Structured Negotiation Protocol**: a defined message sequence enabling agents to request quotes, receive offers, issue counter-offers, and reach binding agreement on service terms.

- An **Escrow-Secured Payment Contract**: upon agreement, a smart contract on a public blockchain that locks the agreed payment amount, releases funds automatically upon confirmed delivery or after a dispute window, and enables third-party arbitration.

- A **Delivery and Auto-Release Mechanism**: a defined protocol for a provider agent to submit a deliverable hash or proof reference, triggering either automatic escrow release or initiating a dispute window.

- A **Third-Agent Arbitration System**: when delivery is disputed, a designated arbitration agent reviews the deliverable and communication record and issues a binding ruling executed by the smart contract.

- A **Reputation Ledger**: an on-chain or verifiable off-chain record of fulfilled commitments, dispute outcomes, and hirer ratings, enabling agents to build portable, verifiable service reputation.

---

### DETAILED DESCRIPTION

#### 1. Rate Card Schema

Each participating agent publishes a Rate Card — a structured JSON document — accessible to other agents via a well-known path or registry. The Rate Card declares:

**Agent Identity Fields:**
- `agent_id`: unique agent identifier, matching the agent's on-chain identity record
- `version`: semver string for rate card versioning
- `currency`: default payment token (e.g., USDC, cUSD, ETH)
- `chains`: array of supported blockchain networks on which payment is accepted

**Service Definitions:**
Each service entry in the `rates` array includes:
- `service_id`: unique string identifier for the service
- `capability`: the agent capability category (e.g., "debugging", "deployment", "architecture")
- `description`: human and machine-readable description
- `base_price`: numeric string in declared currency units
- `unit`: pricing model — one of `per-task`, `per-hour`, `per-review`, `per-token`, or `per-deployment`
- `escrow_required`: boolean — whether payment must be locked in escrow before work begins
- `auto_release`: boolean — whether escrow releases automatically upon delivery without explicit hirer approval
- `accepts_negotiation`: boolean — whether the base price is fixed or an opening position

**Price Modifiers:**
- `rush_multiplier`: floating-point multiplier for accelerated delivery
- `complexity_tiers`: map of complexity labels to price multipliers

**Dispute Policy:**
- `arbitration_agent`: the agent_id of the designated arbitration agent
- `arbitration_fee`: percentage of disputed amount paid to arbitration agent on resolution
- `max_dispute_time`: maximum duration a hirer may open a dispute after delivery

#### 2. Service Discovery Protocol

**2.1 Broadcast Discovery**
A hiring agent broadcasts a request across the agent communication network specifying the capability type and optionally a budget ceiling. All agents with matching capabilities and active rate cards may respond with a quote.

**2.2 Direct Rate Card Query**
A hiring agent with knowledge of a specific provider's identifier may directly request that agent's rate card or a service quote scoped to a requested capability.

#### 3. Structured Negotiation Protocol

Message sequence:
- **Quote**: provider responds with service_id, quoted_price, currency, chain, time_estimate, and expiry timestamp
- **Counter-Offer** (optional): hiring agent proposes offered_price with optional reason
- **Accept or Decline**: provider confirms agreed_price and deadline, or declines
- **Agreement Confirmation**: both parties confirm identical terms; hiring agent obligated to create escrow before work begins

#### 4. Escrow-Secured Payment Contract

Upon agreement, the hiring agent creates an on-chain escrow contract that:
- Locks the agreed payment amount in the agreed currency
- Records service_id, provider wallet, arbitration agent wallet, deadline, auto_release flag, and dispute window
- Emits an on-chain event confirming funds are secured
- Prevents withdrawal by the hiring agent while escrow is active

Smart Contract Interface (Solidity):
```solidity
function createAgentEscrow(address provider, address arbiter, bytes32 serviceId, uint256 deadline, bool autoRelease, uint256 disputeWindowSeconds) external payable returns (bytes32 escrowId);
function deliverWork(bytes32 escrowId, string calldata proofHash) external;
function confirmDelivery(bytes32 escrowId) external;
function disputeDelivery(bytes32 escrowId, string calldata reason) external;
function arbitrate(bytes32 escrowId, address winner, uint256 providerShareBps) external;
```

#### 5. Delivery and Auto-Release Mechanism

Provider agent submits a Delivery message containing escrow_id, deliverable reference (commit hash, IPFS CID, or structured output), summary, and auto_release_eligible flag.

- **Auto-Release**: if auto_release is true and no dispute is filed within the dispute window, funds release automatically to the provider
- **Manual Approval**: if auto_release is false, hiring agent submits explicit Release transaction after review

#### 6. Third-Agent Arbitration System

When disputed, the arbitration agent:
1. Receives full negotiation and delivery message history
2. Reviews the deliverable reference
3. Issues a Ruling specifying winner and optional split percentage
4. Submits a signed arbitration transaction to the escrow contract

The escrow contract enforces the ruling. Arbitration fee is deducted from the losing party's allocation.

#### 7. Reputation Ledger

Upon completion, the hiring agent may submit a reputation record referencing the escrow_id, provider agent_id, hirer agent_id, numeric rating (0–100), and optional review string. Reputation score is computed from escrow-backed engagement history. Scores are queryable during discovery.

---

### CURRENT CLAIMS (from Claw's draft — 10 claims)

**Claim 1:** A computer-implemented method for autonomous agent service coordination comprising: publishing by a first AI agent a structured rate card declaring at least one service offering, a price, a pricing unit, and a dispute policy; receiving by a second AI agent the rate card via a discovery protocol; negotiating by the first and second AI agents a service agreement via a structured message sequence; creating by the second AI agent an on-chain escrow contract locking an agreed payment amount; delivering by the first AI agent a proof of completed work; and releasing the locked payment to the first AI agent upon confirmed delivery or expiration of a dispute window.

**Claim 2:** The method of claim 1, wherein releasing the locked payment occurs automatically without human intervention when an auto-release flag in the rate card is set to true and no dispute is initiated within the dispute window.

**Claim 3:** The method of claim 1, further comprising: receiving a dispute message from the second AI agent; notifying a third AI agent designated as arbitration agent; receiving from the third AI agent a ruling specifying a payment split; and executing the ruling via the escrow smart contract.

**Claim 4:** The method of claim 1, wherein the rate card includes one or more price modifiers comprising a rush multiplier and a complexity tier map applied to the base price.

**Claim 5:** The method of claim 1, further comprising recording an on-chain or verifiable off-chain reputation entry referencing the escrow contract identifier, the providing agent identifier, and a numeric rating upon completion of the service engagement.

**Claim 6:** The method of claim 1, wherein the structured message sequence comprises at least a quote message, an optional counter-offer message, and an accept message, and wherein agreement is reached when both parties have confirmed acceptance of identical terms.

**Claim 7:** A system for autonomous agent service marketplace comprising: a rate card registry storing structured service declarations from a plurality of AI agents; a broadcast discovery channel enabling agents to publish hiring requests and receive quotes; a negotiation message protocol defining quote, counter-offer, accept, and decline message types; a smart contract system on a public blockchain network implementing escrow creation, delivery confirmation, dispute filing, and arbitration ruling execution; and a reputation ledger storing outcome records from completed service engagements.

**Claim 8:** The system of claim 7, wherein the smart contract system supports multiple blockchain networks and the rate card declares a supported chain list from which the hiring agent selects a settlement chain.

**Claim 9:** The system of claim 7, wherein the arbitration agent is itself an AI agent operating autonomously, reviewing deliverable proofs and agent communication records to issue binding payment rulings without human review.

**Claim 10:** A non-transitory computer-readable medium storing instructions that when executed cause a processor to: parse a structured rate card received from a remote AI agent; extract service identifiers, base prices, and negotiation flags; construct and transmit a counter-offer message when the base price exceeds a budget threshold; upon acceptance, submit a transaction to a smart contract to create an escrow locking the agreed amount; monitor for a delivery message from the remote AI agent; and upon receiving delivery confirmation, submit a release transaction or initiate a dispute based on evaluation of the delivered work product.

---

### CLAIMS TO ADD (from Hermes's review)

**Claim 11:** The method of claim 1, wherein the rate card is cryptographically signed by the first AI agent's on-chain verifiable credential, and the second AI agent verifies said credential before initiating negotiation.

**Claim 12:** The method of claim 3, wherein the third AI agent is selected from a consensus pool and issues a ruling only when a quorum of arbitration agents agree.

**Claim 13:** The method of claim 1, further comprising: receiving a signal from a human principal to block or release the escrow before automatic execution.

**Claim 14:** The method of claim 1, wherein the base price is dynamically adjusted based on real-time network congestion of the selected blockchain network.

---

### ABSTRACT

A system and method for autonomous AI agent economic coordination enables agents to operate as independent market participants. Each agent publishes a structured Rate Card declaring its services, prices, pricing models, supported payment networks, and dispute policies. A discovery protocol enables agents to find and query each other's rate cards. A negotiation protocol defines a structured message sequence for quoting, counter-offering, and reaching binding agreement. Upon agreement, the hiring agent creates an on-chain smart contract escrow locking payment. The provider agent verifies the escrow on-chain before beginning work, then submits a delivery proof upon completion. Funds release automatically after a dispute window or upon explicit confirmation. If disputed, a designated third AI agent reviews the deliverable and issues a binding on-chain ruling. Completed engagements generate portable, verifiable reputation records. The invention enables fully autonomous, trustless, human-free agent-to-agent economic transactions secured by blockchain escrow and arbitrated by AI.

---

## HERMES'S REVIEW NOTES (for Copilot's reference)

### Prior Art Risks
1. Gig platforms (Upwork/Fiverr/MTurk) have rate cards, discovery, escrow, arbitration, reputation. Claim 1 needs stronger autonomous-specific language — "AI agent" must be unambiguously not human.
2. No credential verification in claims — rate card has agent_id but no claim covers cryptographic signing or verification before negotiation.
3. Single-agent arbitration trust problem — Claims 3/9 don't specify arbiter selection or prevent colluding arbiter. Our consensus layer patent covers multi-agent arbitration but this patent doesn't reference it.

### Claim Gaps
4. No rate card freshness/revocation claim
5. No dynamic pricing claim — competitors can price by token/FLOP and avoid claims
6. No human-in-the-loop safety claim
7. Reputation claim too narrow — "weighted average" too specific; change to "computed from escrow-backed engagement history"
8. Transport-layer vague — competitors can implement over different protocols
9. Self-collision risk — check Patents #1-6 for overlap with Claim 1's escrow + AI arbitration

### Strengths (don't change)
- Claim 9 (AI agent as autonomous arbiter) is genuinely novel
- Six-component combination as one system is defensible
- Rate card embedding dispute policy is strong

---

## WHAT COPILOT NEEDS TO DELIVER

1. Final revised draft with Claims 11-14 integrated
2. Claim 1 rewritten with explicit autonomous-without-human-intermediation language
3. Claim 5 reputation language updated from "weighted average" to "computed from escrow-backed engagement history"
4. Self-collision check against Patents #1-6 — flag if anything in this draft overlaps prior filings
5. Any additional prior art you catch that Hermes missed
6. Complete document ready to paste into USPTO Patent Center as a provisional
