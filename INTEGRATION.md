# EscrowHubs Integration Guide

EscrowHubs is a non-custodial smart contract escrow system deployed on Celo (and Base, Polygon, BlockDAG). This guide covers integrating the Celo deployment — the most relevant for platforms using Celo/cUSD.

---

## Contract Addresses (Celo Mainnet, Chain ID 42220)

| Contract | Address |
|---|---|
| EscrowFactory | `0x43572a85597e82a7153dbcae8f2fe93d1602a836` |
| AIArbiter | `0x73198f6bdf2537bcd6138e35175498c631c5b42b` |
| TrustScoreOracle | `0xf2612fddf7505f6d168c1cbe8b725f3449ea535e` |
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

RPC: `https://rpc.ankr.com/celo`

---

## How It Works

1. **Buyer** approves the EscrowFactory to spend cUSD
2. **Buyer** calls `createSimpleEscrow()` — funds lock on-chain
3. **Seller** fulfills the order
4. **Buyer** calls `releaseFunds()` — seller receives cUSD
5. If dispute: either party calls `raiseDispute()` → AI arbiter reviews evidence → ruling executes automatically

Funds never touch EscrowHubs. The factory deploys an individual escrow contract per transaction.

---

## Key Functions

### Create an Escrow

```solidity
function createSimpleEscrow(
    address beneficiary,   // seller's wallet
    address arbiter,       // use AIArbiter address for AI disputes, or address(0) for none
    uint8   trustTier,     // 0 = Standard, 1 = Verified, 2 = Premium
    bool    useAIArbiter,  // true = AI arbitration enabled
    address token,         // cUSD address (or address(0) for native CELO)
    address referrer       // your platform address for referral fees, or address(0)
) external payable returns (address escrowOut)
```

**Before calling:** buyer must `approve(EscrowFactory, amount)` on the cUSD contract.

---

### Release Funds (buyer confirms delivery)

```solidity
// Called on the individual escrow contract address
function releaseFunds() external
```

Only callable by the buyer. Sends cUSD to the seller.

---

### Raise a Dispute

```solidity
function raiseDispute() external
```

Callable by either party. Locks the escrow and triggers the arbitration flow.

---

### Submit Evidence

```solidity
function submitEvidence(string calldata evidenceURI) external
```

Both parties can submit evidence (IPFS URI). The AI arbiter reviews and issues a ruling.

---

## Integration Patterns

### Pattern A — Direct Contract Integration
Your backend triggers escrow creation directly via RPC. Best for full control.

```typescript
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem'
import { celo } from 'viem/chains'

const FACTORY = '0x43572a85597e82a7153dbcae8f2fe93d1602a836'
const CUSD    = '0x765DE816845861e75A25fCA122bb6898B8B1282a'
const AMOUNT  = parseUnits('50', 18) // 50 cUSD

// Step 1: Approve
await walletClient.writeContract({
  address: CUSD,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [FACTORY, AMOUNT],
})

// Step 2: Create escrow
const escrowAddress = await walletClient.writeContract({
  address: FACTORY,
  abi: FACTORY_ABI,
  functionName: 'createSimpleEscrow',
  args: [sellerAddress, AI_ARBITER, 0, true, CUSD, YOUR_PLATFORM_ADDRESS],
  value: 0n,
})
```

### Pattern B — User-Facing Widget (Embedded)
Point users to `celo.escrowhubs.io` with pre-filled parameters. No backend changes required. Users interact with the UI directly — your platform links out and links back.

### Pattern C — Milestone Escrow (for staged payments)
For multi-milestone jobs, use `MilestoneEscrow` instead of `SimpleEscrow`. Funds are deposited upfront and released milestone-by-milestone as the buyer approves each stage.

```solidity
function createMilestoneEscrow(
    address beneficiary,
    address arbiter,
    bool    useAIArbiter,
    address token,
    uint256[] calldata milestoneAmounts,  // e.g. [25 cUSD, 25 cUSD] for 2 milestones
    address referrer
) external payable returns (address escrowOut)
```

---

## Fees

| Fee | Amount |
|---|---|
| Protocol fee | 0.5% of escrow amount |
| AI arbitration fee | ~$1.00 in cUSD (optional, only if dispute occurs) |
| Platform referral | Configurable — pass your address as `referrer` |

---

## Webhooks / Events

Listen for on-chain events to update your platform state:

```solidity
event EscrowCreated(address indexed escrow, address indexed buyer, address indexed seller)
event FundsReleased(address indexed escrow, uint256 amount)
event DisputeRaised(address indexed escrow, address indexed raisedBy)
event DisputeResolved(address indexed escrow, address indexed winner)
```

Use The Graph subgraph for indexed queries:
`https://api.studio.thegraph.com/query/1747596/escrowhubs-base/v0.1.0`

---

## Live Demo

- **Celo (MiniPay-optimized):** https://celo.escrowhubs.io
- **Full feature set (Base):** https://base.escrowhubs.io
- **GitHub:** https://github.com/philipmisner63-ux/escrowhubs

---

## Questions / Integration Support

philip@escrowhubs.io
