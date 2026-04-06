# EscrowHubs

**Trustless escrow with AI-powered dispute resolution, built on BlockDAG.**

Featured on [BlockDAG Academy](https://academy.blockdag.network) as a live case study.

---

## What Is It?

EscrowHubs is a decentralized escrow platform where two parties anywhere in the world can lock funds in a smart contract and release them based on agreed conditions — no bank, no lawyer, no middleman.

When something goes wrong, disputes are resolved automatically by an **AI oracle** that reviews on-chain evidence and executes the ruling. Minutes, not weeks.

---

## How It Works

### 1. Two parties agree off-chain
A buyer (depositor) and seller (beneficiary) agree on terms — a job, a trade, a project. They share wallet addresses.

### 2. Depositor creates the escrow
Using the dashboard, the depositor deploys a contract with:
- The **beneficiary's wallet address**
- An **arbiter** — either a trusted wallet or the **AI Arbiter** contract
- The **amount** to lock

### 3. Funds are locked on-chain
Once deployed, the BDAG is locked in the contract. Neither party can touch it unilaterally.

### 4. Work happens
The beneficiary delivers. The depositor confirms and releases — or raises a dispute.

### 5. Resolution
- **Normal:** Depositor calls `release()` → beneficiary receives funds
- **Dispute (manual arbiter):** Arbiter wallet calls `resolveRelease()` or `resolveRefund()`
- **Dispute (AI Arbiter):** Both parties submit evidence on-chain → AI oracle reviews → executes automatically

---

## Contract Types

### Simple Escrow
Single-release escrow. One lock, one release. Best for:
- Freelance gigs
- One-time purchases
- Simple bilateral agreements

### Milestone Escrow
Phased payments. Each milestone releases independently. Best for:
- Software development
- Long-term projects
- Any work with defined stages

---

## AI Arbiter

The AI Arbiter is an on-chain contract (`AIArbiter.sol`) that acts as the arbiter address. An off-chain oracle service watches for disputes, collects evidence, and calls Claude to make a ruling.

**Flow:**
1. Dispute raised on-chain
2. Both parties submit evidence via `submitEvidence(escrowAddress, evidenceText)`
3. Oracle waits 60 seconds for evidence, then queries AI
4. AI returns `RELEASE` or `REFUND`
5. Oracle signs and submits resolution transaction
6. Funds move automatically

**Evidence** is stored permanently on-chain and visible to both parties.

---

## Fee Structure

| Action | Fee |
|--------|-----|
| Create any escrow | 0.5% of escrow amount |
| Use AI Arbiter | +1 BDAG flat fee |
| Manual arbiter | No extra fee |

Fees accumulate in the factory contract and are withdrawable by the owner.

---

## Architecture

```
contracts/
  SimpleEscrow.sol       — Single-release escrow (state machine)
  MilestoneEscrow.sol    — Per-milestone release escrow
  EscrowFactory.sol      — Deployment + indexing + fee collection
  AIArbiter.sol          — On-chain arbiter contract + evidence log
  TrustScoreOracle.sol   — Off-chain trust score storage

frontend/
  src/app/
    page.tsx             — Landing page
    dashboard/           — View all escrows
    create/              — Deploy new escrow
    escrow/[id]/         — Escrow detail + actions + evidence submission

oracle/
  index.js               — AI oracle service (Node.js)
                           Watches for Disputed events → fetches evidence
                           → queries Claude → executes resolution
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | BlockDAG (Chain ID: 1404) |
| Smart Contracts | Solidity 0.8.24, Hardhat 3 |
| Contract Tooling | hardhat-toolbox-viem, OpenZeppelin v5 |
| Frontend | Next.js 16, Tailwind CSS, shadcn/ui |
| Web3 | wagmi v2, viem, RainbowKit |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Oracle | Node.js, viem |

---

## Deploying

### Prerequisites
- Node.js 22+
- pnpm
- A funded BlockDAG wallet

### 1. Clone and install
```
git clone https://github.com/philipmisner63-ux/blockdag-escrow.git
cd blockdag-escrow
```

### 2. Deploy contracts
```
cd contracts
cp .env.example .env
# Add DEPLOYER_PRIVATE_KEY to .env
pnpm install
pnpm hardhat deploy --network blockdag
```

This deploys all four contracts and prints the addresses. Copy them to your `.env` files.

### 3. Start the frontend
```
cd ../frontend
cp .env.example .env.local
# Add contract addresses from deploy output
pnpm install
pnpm dev
```

### 4. Start the oracle
```
cd ../oracle
cp .env.example .env
# Add ANTHROPIC_API_KEY, ORACLE_PRIVATE_KEY, AI_ARBITER_ADDRESS
pnpm install
pnpm start
```

---

## Running Tests

```
cd contracts
pnpm hardhat test
```

20 tests covering all contract functions, fee mechanics, and AI arbiter routing.

---

## BlockDAG Network

- **Chain ID:** 1404
- **RPC:** https://rpc.bdagscan.com
- **Explorer:** https://bdagscan.com
- **Native token:** BDAG

---

## License

MIT
