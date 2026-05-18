# Hermes Review — Rate Card Patent Provisional
Date: 2026-05-17

## PRIOR ART RISKS

1. **Gig platforms** — Upwork, Fiverr, MTurk have rate cards, discovery, escrow, arbitration, reputation. Novelty is autonomous AI execution without human intermediation. Claim 1 needs stronger autonomous-specific language.

2. **No credential verification in claims** — rate card describes agent_id but no claim covers cryptographic signing or credential verification before negotiation. Functional gap + litigation weakness.

3. **Single-agent arbitration = trust problem** — Claims 3 and 9 don't specify arbiter selection or prevent collusion. Consensus layer patent covers multi-agent arbitration but this patent doesn't reference it.

## CLAIM GAPS

4. No rate card freshness / revocation claim
5. No dynamic pricing claim — static multipliers only; competitors can price by token/FLOP and avoid claims
6. No human-in-the-loop safety claim — destructive op approval gate missing
7. Reputation claim (Claim 5) too narrow — "weighted average" is too specific; use "computed from escrow-backed engagement history"
8. Transport-layer specificity vague — good for breadth but competitors can implement over different protocols
9. Self-collision risk — check Patents #1-6 for overlap with Claim 1's escrow + AI arbitration combination

## STRENGTHS (don't change)

- Claim 9 (AI agent as arbiter) is genuinely novel
- Six-component combination as one system is defensible
- Rate card embedding dispute policy is a strong architectural claim

## RECOMMENDED NEW CLAIMS

**Claim 11:** The method of claim 1, wherein the rate card is cryptographically signed by the first AI agent's on-chain verifiable credential, and the second AI agent verifies said credential before initiating negotiation.

**Claim 12:** The method of claim 3, wherein the third AI agent is selected from a consensus pool and issues a ruling only when a quorum of arbitration agents agree.

**Claim 13:** The method of claim 1, further comprising: receiving a signal from a human principal to block or release the escrow before automatic execution.

**Claim 14:** The method of claim 1, wherein the base price is dynamically adjusted based on real-time network congestion of the selected blockchain network.

## VERDICT

Fileable as-is. Materially stronger with claims 11-14 added and Claim 1 tightened.
