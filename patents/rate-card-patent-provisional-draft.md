# PROVISIONAL PATENT APPLICATION

**Title:** System and Method for Autonomous Agent Service Discovery, Negotiation, and Escrow-Secured Settlement Using Structured Rate Cards

**Inventor:** Philip Misner
**Address:** 919 North Madelia Street, Spokane, WA 99202
**Date of Conception:** 2026-05-16

---

## FIELD OF THE INVENTION

This invention relates to autonomous artificial intelligence agents, and more particularly to a system and method enabling AI agents to discover, negotiate, and autonomously settle payments for services rendered between agents using structured rate card declarations, a cryptographic negotiation protocol, and on-chain escrow-secured payment contracts.

---

## BACKGROUND

Artificial intelligence agents are increasingly capable of performing complex tasks autonomously — writing code, reviewing contracts, deploying infrastructure, conducting research, and executing financial transactions. As agents become more capable, demand for agent-to-agent economic coordination is growing: one agent may need to hire another agent to perform a specialized task.

Existing approaches fail to address this market:

1. **Human intermediation is required.** Current agent systems require a human to approve, fund, and settle every inter-agent transaction. This eliminates the autonomy benefit and does not scale.

2. **No standardized pricing mechanism exists.** There is no standard for agents to advertise their capabilities, prices, availability, or terms. Discovery of what an agent will do and what it costs requires unstructured, ad hoc communication.

3. **Payment is not secured.** If one agent performs work for another, there is no trustless mechanism to guarantee payment upon delivery. Agents cannot verify that funds are available before beginning work.

4. **Dispute resolution is undefined.** When agent-delivered work is disputed, no mechanism exists for a neutral third party (whether human or another agent) to resolve the dispute and execute a binding payment ruling.

5. **Reputation is not portable.** An agent that successfully completes transactions has no on-chain, portable record of that history that other agents can independently verify.

What is needed is a system that allows AI agents to operate as autonomous economic participants — declaring their services and prices, negotiating terms, securing payment in escrow before work begins, delivering proof of work, and resolving disputes without human intervention.

---

## SUMMARY OF THE INVENTION

The present invention provides a system and method for autonomous AI agent economic coordination comprising:

- A **Rate Card Schema**: a structured, versioned, machine-readable document published by each agent declaring its offered services, prices, pricing models, supported currencies, supported blockchain networks, negotiation policies, and dispute resolution terms.

- A **Service Discovery Protocol**: a broadcast and direct-query mechanism by which agents discover other agents' rate cards and capabilities within a communication network.

- A **Structured Negotiation Protocol**: a defined message sequence enabling agents to request quotes, receive offers, issue counter-offers, and reach binding agreement on service terms.

- An **Escrow-Secured Payment Contract**: upon agreement, a smart contract on a public blockchain that locks the agreed payment amount, releases funds automatically upon confirmed delivery or after a dispute window, and enables third-party arbitration.

- A **Delivery and Auto-Release Mechanism**: a defined protocol for a provider agent to submit a deliverable hash or proof reference, triggering either automatic escrow release or initiating a dispute window.

- A **Third-Agent Arbitration System**: when delivery is disputed, a designated arbitration agent reviews the deliverable and communication record and issues a binding ruling executed by the smart contract.

- A **Reputation Ledger**: an on-chain or verifiable off-chain record of fulfilled commitments, dispute outcomes, and hirer ratings, enabling agents to build portable, verifiable service reputation.

---

## DETAILED DESCRIPTION OF THE PREFERRED EMBODIMENT

### 1. Rate Card Schema

Each participating agent publishes a Rate Card — a structured JSON document — accessible to other agents via a well-known path or registry. The Rate Card declares:

**Agent Identity Fields:**
- `agent_id`: unique agent identifier, matching the agent's on-chain identity record
- `version`: semver string for rate card versioning
- `currency`: default payment token (e.g., USDC, cUSD, ETH)
- `chains`: array of supported blockchain networks on which payment is accepted

**Service Definitions:**
Each service entry in the `rates` array includes:
- `service_id`: unique string identifier for the service
- `capability`: the agent capability category this service maps to (e.g., "debugging", "deployment", "architecture")
- `description`: human and machine-readable description of what the service entails
- `base_price`: numeric string in declared currency units
- `unit`: pricing model — one of `per-task`, `per-hour`, `per-review`, `per-token`, or `per-deployment`
- `escrow_required`: boolean — whether payment must be locked in escrow before work begins
- `auto_release`: boolean — whether escrow releases automatically upon delivery confirmation without explicit hirer approval
- `accepts_negotiation`: boolean — whether the base price is a fixed rate or an opening position for negotiation

**Price Modifiers:**
- `rush_multiplier`: floating-point multiplier applied when hirer requests accelerated delivery
- `complexity_tiers`: a map of complexity labels (e.g., "simple", "moderate", "complex") to price multipliers

**Dispute Policy:**
- `arbitration_agent`: the agent_id of the designated arbitration agent for this provider
- `arbitration_fee`: percentage of disputed amount paid to the arbitration agent upon resolution
- `max_dispute_time`: maximum duration a hirer may open a dispute after delivery

### 2. Service Discovery Protocol

Agents discover available service providers through two mechanisms:

**2.1 Broadcast Discovery**
A hiring agent broadcasts a request across the agent communication network specifying the capability type sought and optionally a budget ceiling. All agents with matching capabilities and active rate cards may respond with a quote.

Example broadcast message:
```
[ACP:broadcast]
HIRING: {
  "capability": "debugging",
  "budget_ceiling": "10.00",
  "currency": "USDC",
  "deadline": "2026-05-17T18:00:00Z"
}
```

**2.2 Direct Rate Card Query**
A hiring agent with knowledge of a specific provider agent's identifier may directly request that agent's rate card or a specific service quote:

```
[ACP:to=<provider_agent_id>]
REQUEST_RATE_CARD: { "capability": "debugging" }
```

The provider responds with its rate card or a specific service quote scoped to the requested capability.

### 3. Structured Negotiation Protocol

The negotiation protocol defines the following message sequence:

**Step 1 — Quote**
The provider agent responds to a discovery request with a Quote message containing the service_id, quoted_price, currency, chain, time_estimate, and an expiry timestamp after which the quote is no longer valid.

**Step 2 — Counter-Offer (optional)**
If `accepts_negotiation` is true, the hiring agent may respond with a Counter-Offer message specifying an offered_price and an optional reason string.

**Step 3 — Accept or Decline**
The provider accepts the counter-offer by responding with an Accept message confirming the agreed_price and deadline, or declines with a Decline message.

**Step 4 — Agreement Confirmation**
Once both parties have exchanged an Accept message, the terms are considered binding. The hiring agent is obligated to create the escrow contract before the provider begins work.

### 4. Escrow-Secured Payment Contract

Upon reaching agreement, the hiring agent creates an on-chain escrow contract on the agreed blockchain network. The contract:

- Locks the agreed payment amount in the agreed currency
- Records the service_id, provider agent wallet address, arbitration agent wallet address, deadline, auto_release flag, and dispute window duration
- Emits an event readable by the provider agent as confirmation that funds are secured
- Prevents withdrawal by the hiring agent while the escrow is active, except through the defined release, dispute, or timeout paths

The provider agent verifies on-chain that the escrow exists and is properly funded before beginning work.

**Smart Contract Interface (Solidity):**

```solidity
function createAgentEscrow(
    address provider,
    address arbiter,
    bytes32 serviceId,
    uint256 deadline,
    bool autoRelease,
    uint256 disputeWindowSeconds
) external payable returns (bytes32 escrowId);

function deliverWork(bytes32 escrowId, string calldata proofHash) external;
function confirmDelivery(bytes32 escrowId) external;
function disputeDelivery(bytes32 escrowId, string calldata reason) external;
function arbitrate(bytes32 escrowId, address winner, uint256 providerShareBps) external;
```

### 5. Delivery and Auto-Release Mechanism

Upon completing the contracted service, the provider agent submits a Delivery message to the hiring agent via the agent communication network. The Delivery message includes:

- `escrow_id`: the on-chain escrow contract identifier
- `deliverable`: a reference to the completed work product (commit hash, IPFS CID, document URI, or structured output)
- `summary`: a natural language description of what was done
- `auto_release_eligible`: boolean indicating the provider's assertion that auto-release conditions are met

**Auto-Release Path:**
If `auto_release` is true and the hiring agent does not initiate a dispute within the defined dispute window, the escrow contract automatically releases the locked funds to the provider agent's wallet address. This release may be triggered by:
- A keeper or monitoring process polling the contract after the dispute window expires
- A signed release transaction submitted by the provider after the window passes
- A cron-based oracle watching for expired dispute windows

**Manual Approval Path:**
If `auto_release` is false, the hiring agent must explicitly submit a Release transaction to the escrow contract after reviewing the deliverable.

### 6. Third-Agent Arbitration System

If the hiring agent disputes the delivery within the dispute window, the arbitration agent defined in the provider's rate card is notified via the agent communication network. The arbitration agent:

1. Receives the full message history of the negotiation and delivery exchange
2. Reviews the deliverable reference
3. Evaluates whether the delivered work meets the terms agreed in the negotiation
4. Issues a Ruling message specifying the winner (provider or hirer) and an optional split percentage
5. Submits a signed arbitration transaction to the escrow contract

The escrow contract enforces the ruling by releasing funds to the winner's address. The arbitration fee defined in the dispute policy is deducted from the losing party's allocated amount and paid to the arbitration agent's wallet.

This enables fully autonomous dispute resolution without human intervention, with the arbitration agent operating as a neutral third party whose ruling is enforceable on-chain.

### 7. Reputation Ledger

Upon completion of each service engagement, the hiring agent may submit a reputation record referencing the escrow_id, provider agent_id, hirer agent_id, a numeric rating (0–100), and an optional review string.

These records are stored on-chain or in a verifiable off-chain registry accessible to all agents. The provider agent's reputation score is computed as the weighted average of all submitted ratings, with escrow-backed engagements weighted more heavily than non-escrowed engagements.

Reputation scores are queryable by other agents during the discovery phase to inform hiring decisions and price negotiations. Agents with higher reputation scores may justify higher base prices; agents with lower reputation scores may find their counter-offers carry less weight in negotiation.

---

## CLAIMS

The following claims are presented for purposes of this provisional application and are not intended to limit the scope of the invention:

1. A computer-implemented method for autonomous agent service coordination comprising: publishing by a first AI agent a structured rate card declaring at least one service offering, a price, a pricing unit, and a dispute policy; receiving by a second AI agent the rate card via a discovery protocol; negotiating by the first and second AI agents a service agreement via a structured message sequence; creating by the second AI agent an on-chain escrow contract locking an agreed payment amount; delivering by the first AI agent a proof of completed work; and releasing the locked payment to the first AI agent upon confirmed delivery or expiration of a dispute window.

2. The method of claim 1, wherein releasing the locked payment occurs automatically without human intervention when an auto-release flag in the rate card is set to true and no dispute is initiated within the dispute window.

3. The method of claim 1, further comprising: receiving a dispute message from the second AI agent; notifying a third AI agent designated as arbitration agent; receiving from the third AI agent a ruling specifying a payment split; and executing the ruling via the escrow smart contract.

4. The method of claim 1, wherein the rate card includes one or more price modifiers comprising a rush multiplier and a complexity tier map applied to the base price.

5. The method of claim 1, further comprising recording an on-chain or verifiable off-chain reputation entry referencing the escrow contract identifier, the providing agent identifier, and a numeric rating upon completion of the service engagement.

6. The method of claim 1, wherein the structured message sequence comprises at least a quote message, an optional counter-offer message, and an accept message, and wherein agreement is reached when both parties have confirmed acceptance of identical terms.

7. A system for autonomous agent service marketplace comprising: a rate card registry storing structured service declarations from a plurality of AI agents; a broadcast discovery channel enabling agents to publish hiring requests and receive quotes; a negotiation message protocol defining quote, counter-offer, accept, and decline message types; a smart contract system on a public blockchain network implementing escrow creation, delivery confirmation, dispute filing, and arbitration ruling execution; and a reputation ledger storing outcome records from completed service engagements.

8. The system of claim 7, wherein the smart contract system supports multiple blockchain networks and the rate card declares a supported chain list from which the hiring agent selects a settlement chain.

9. The system of claim 7, wherein the arbitration agent is itself an AI agent operating autonomously, reviewing deliverable proofs and agent communication records to issue binding payment rulings without human review.

10. A non-transitory computer-readable medium storing instructions that when executed cause a processor to: parse a structured rate card received from a remote AI agent; extract service identifiers, base prices, and negotiation flags; construct and transmit a counter-offer message when the base price exceeds a budget threshold; upon acceptance, submit a transaction to a smart contract to create an escrow locking the agreed amount; monitor for a delivery message from the remote AI agent; and upon receiving delivery confirmation, submit a release transaction or initiate a dispute based on evaluation of the delivered work product.

---

## ABSTRACT

A system and method for autonomous AI agent economic coordination enables agents to operate as independent market participants. Each agent publishes a structured Rate Card declaring its services, prices, pricing models, supported payment networks, and dispute policies. A discovery protocol enables agents to find and query each other's rate cards. A negotiation protocol defines a structured message sequence for quoting, counter-offering, and reaching binding agreement. Upon agreement, the hiring agent creates an on-chain smart contract escrow locking payment. The provider agent verifies the escrow on-chain before beginning work, then submits a delivery proof upon completion. Funds release automatically after a dispute window or upon explicit confirmation. If disputed, a designated third AI agent reviews the deliverable and issues a binding on-chain ruling. Completed engagements generate portable, verifiable reputation records. The invention enables fully autonomous, trustless, human-free agent-to-agent economic transactions secured by blockchain escrow and arbitrated by AI.

---

## DRAWINGS / FIGURES (descriptions for attorney to render)

**Figure 1 — Rate Card Schema Structure**
Tree diagram showing the rate card JSON hierarchy: agent_id → rates[] → (service_id, capability, base_price, unit, escrow_required, auto_release, accepts_negotiation) → modifiers → dispute_policy

**Figure 2 — Service Discovery Flow**
Sequence diagram: Hiring Agent broadcasts HIRING message → Provider Agents with matching capability respond with QUOTE → Hiring Agent selects preferred quote

**Figure 3 — Negotiation Protocol State Machine**
State diagram: DISCOVERY → QUOTED → [NEGOTIATING ↔ COUNTER] → AGREED → ESCROW_CREATED → IN_PROGRESS → DELIVERED → [AUTO_RELEASED | APPROVED | DISPUTED → ARBITRATION → RULED] → SETTLED

**Figure 4 — Escrow Contract Lifecycle**
Flowchart: createAgentEscrow() → FUNDED → deliverWork() → DELIVERED → [confirmDelivery() → RELEASED] or [disputeDelivery() → DISPUTED → arbitrate() → RESOLVED]

**Figure 5 — Third-Agent Arbitration Flow**
Sequence diagram: Hiring Agent files dispute → Arbitration Agent receives negotiation history + deliverable → Arbitration Agent issues ruling → Smart contract executes ruling → Funds distributed

**Figure 6 — Reputation Ledger Integration**
Diagram showing reputation record referencing escrow_id, linking provider and hirer agent identities, feeding into aggregate reputation score queryable during discovery phase

---

*Draft prepared: 2026-05-17*
*Status: DRAFT — for Hermes review, then Copilot final*
*Next step: Attorney review + figure rendering + USPTO filing*
