# EscrowHubs Subgraph — Polygon Mainnet

The Graph subgraph for EscrowHubs on Polygon (Chain ID 137).

## Contract Addresses

| Contract | Address |
|---|---|
| EscrowFactory | `0x93e86fac9a15add437363f7bbec776bdbc932411` |
| AIArbiter | `0x79e78c1ed9a8e239a8334294bf4f0d356f858416` |
| TrustScoreOracle | `0xf2612fddf7505f6d168c1cbe8b725f3449ea535e` |
| SimpleEscrow | Dynamic (one per escrow, created by EscrowFactory) |
| MilestoneEscrow | Dynamic (one per escrow, created by EscrowFactory) |

## Entities

- **Escrow** — indexed per contract address; tracks buyer, seller, arbiter, token, amount, status, type
- **FundRelease** — each `Released` event on a SimpleEscrow
- **MilestoneRelease** — each `MilestoneReleased` event on a MilestoneEscrow
- **Dispute** — opened by `Disputed` / `MilestoneDisputed`; resolved by `DisputeResolved` from AIArbiter
- **TrustScoreChange** — every `ScoreUpdated` event on TrustScoreOracle, with previous score snapshot
- **WalletTrustScore** — current score per wallet (used internally for previousScore tracking)
- **GlobalStats** — singleton `id = "global"`: total escrows, volume, active count, dispute rate

## Prerequisites

```bash
npm install -g @graphprotocol/graph-cli
```

## Setup

### 1. Create the subgraph in Subgraph Studio

Go to https://thegraph.com/studio and create a new subgraph named **escrowhubs-polygon**.

### 2. Authenticate

```bash
graph auth --studio <deploy-key>
```

Get your deploy key from the Subgraph Studio dashboard.

### 3. Install dependencies

```bash
cd subgraph
npm install
```

### 4. Generate AssemblyScript types

```bash
graph codegen
```

This reads `subgraph.yaml` + ABIs and generates TypeScript bindings in `generated/`.

### 5. Build

```bash
graph build
```

Compiles AssemblyScript mappings to WASM.

### 6. Deploy to Subgraph Studio

```bash
graph deploy --studio escrowhubs-polygon
```

You will be prompted for a version label (e.g. `v0.1.0`).

## Example Queries

```graphql
# All escrows for a buyer
{
  escrows(where: { buyer: "0x..." }) {
    id
    type
    status
    amount
    seller
    createdAt
  }
}

# Global stats
{
  globalStats(id: "global") {
    totalEscrows
    totalVolume
    activeEscrows
    totalDisputes
    disputeRate
  }
}

# Disputes with resolution
{
  disputes(where: { resolution_not: null }) {
    id
    escrow { id type }
    resolution
    openedAt
    resolvedAt
  }
}

# Trust score history for a wallet
{
  trustScoreChanges(
    where: { wallet: "0x..." }
    orderBy: timestamp
    orderDirection: desc
  ) {
    newScore
    previousScore
    timestamp
  }
}
```

## Notes

- `startBlock` is set to `68000000` for all static data sources (approximate EscrowFactory deployment block on Polygon).
- SimpleEscrow uses `Deposited(address,uint256)` (not `Funded`) — this reflects the actual on-chain event.
- The AIArbiter `DisputeResolved` event carries only the escrow address + resolution string (`"release"` or `"refund"`). For milestone disputes the subgraph resolves the most recent open dispute by escrow ID.
- `disputeRate` in `GlobalStats` = `totalDisputes / totalEscrows` as a `BigDecimal`.
