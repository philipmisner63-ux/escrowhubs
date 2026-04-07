import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Released,
  Refunded,
  Disputed,
} from "../generated/templates/SimpleEscrow/SimpleEscrow";
import {
  Funded,
  MilestoneReleased,
  MilestoneDisputed,
  MilestoneRefunded,
} from "../generated/templates/MilestoneEscrow/MilestoneEscrow";
import {
  Escrow,
  FundRelease,
  MilestoneRelease,
  Dispute,
  GlobalStats,
} from "../generated/schema";

function loadOrCreateGlobalStats(): GlobalStats {
  let existing = GlobalStats.load("global");
  if (existing != null) return existing;

  let stats = new GlobalStats("global");
  stats.totalEscrows = BigInt.fromI32(0);
  stats.totalVolume = BigInt.fromI32(0);
  stats.activeEscrows = BigInt.fromI32(0);
  stats.totalDisputes = BigInt.fromI32(0);
  stats.resolvedDisputes = BigInt.fromI32(0);
  stats.disputeRate = BigDecimal.fromString("0");
  return stats;
}

// ─── SimpleEscrow handlers ───────────────────────────────────────────────────

export function handleDeposited(event: Deposited): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  escrow.status = "FUNDED";
  escrow.amount = event.params.amount;
  escrow.save();
}

export function handleReleased(event: Released): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  let wasActive =
    escrow.status != "RELEASED" && escrow.status != "REFUNDED" && escrow.status != "RESOLVED";
  escrow.status = "RELEASED";
  escrow.save();

  let releaseId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let release = new FundRelease(releaseId);
  release.escrow = escrowId;
  release.recipient = event.params.to;
  release.amount = event.params.amount;
  release.timestamp = event.block.timestamp;
  release.txHash = event.transaction.hash;
  release.save();

  if (wasActive) {
    let stats = loadOrCreateGlobalStats();
    stats.activeEscrows = stats.activeEscrows.minus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handleRefunded(event: Refunded): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  let wasActive =
    escrow.status != "RELEASED" && escrow.status != "REFUNDED" && escrow.status != "RESOLVED";
  escrow.status = "REFUNDED";
  escrow.save();

  if (wasActive) {
    let stats = loadOrCreateGlobalStats();
    stats.activeEscrows = stats.activeEscrows.minus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handleDisputed(event: Disputed): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  escrow.status = "DISPUTED";
  escrow.save();

  // ID = escrowAddress (only one dispute per simple escrow)
  let dispute = new Dispute(escrowId);
  dispute.escrow = escrowId;
  dispute.initiator = event.params.by;
  dispute.openedAt = event.block.timestamp;
  dispute.save();

  let stats = loadOrCreateGlobalStats();
  stats.totalDisputes = stats.totalDisputes.plus(BigInt.fromI32(1));
  if (stats.totalEscrows.gt(BigInt.fromI32(0))) {
    stats.disputeRate = stats.totalDisputes
      .toBigDecimal()
      .div(stats.totalEscrows.toBigDecimal());
  }
  stats.save();
}

// ─── MilestoneEscrow handlers ─────────────────────────────────────────────────

export function handleFunded(event: Funded): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  escrow.status = "FUNDED";
  escrow.amount = event.params.total;
  escrow.save();
}

export function handleMilestoneReleased(event: MilestoneReleased): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  let releaseId = escrowId + "-" + event.params.index.toString();
  let release = new MilestoneRelease(releaseId);
  release.escrow = escrowId;
  release.milestoneIndex = event.params.index;
  release.amount = event.params.amount;
  release.timestamp = event.block.timestamp;
  release.txHash = event.transaction.hash;
  release.save();
}

export function handleMilestoneDisputed(event: MilestoneDisputed): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  escrow.status = "DISPUTED";
  escrow.save();

  // ID = escrowAddress-milestoneIndex (one dispute per milestone)
  let disputeId = escrowId + "-" + event.params.index.toString();
  let dispute = new Dispute(disputeId);
  dispute.escrow = escrowId;
  dispute.milestoneIndex = event.params.index;
  dispute.openedAt = event.block.timestamp;
  dispute.save();

  let stats = loadOrCreateGlobalStats();
  stats.totalDisputes = stats.totalDisputes.plus(BigInt.fromI32(1));
  if (stats.totalEscrows.gt(BigInt.fromI32(0))) {
    stats.disputeRate = stats.totalDisputes
      .toBigDecimal()
      .div(stats.totalEscrows.toBigDecimal());
  }
  stats.save();
}

export function handleMilestoneRefunded(event: MilestoneRefunded): void {
  let escrowId = event.address.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;
  // Individual milestone refund — escrow-level status remains as-is
  // The milestone state is tracked on-chain; subgraph surfaces the event
  escrow.save();
}
