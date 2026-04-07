import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  EvidenceSubmitted,
  DisputeResolved,
} from "../generated/AIArbiter/AIArbiter";
import { Dispute, Escrow, GlobalStats } from "../generated/schema";

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

export function handleEvidenceSubmitted(event: EvidenceSubmitted): void {
  // Ensure the escrow is marked disputed if it isn't already
  let escrowId = event.params.escrow.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow != null && escrow.status != "DISPUTED" && escrow.status != "RESOLVED") {
    escrow.status = "DISPUTED";
    escrow.save();
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let escrowId = event.params.escrow.toHexString();
  let escrow = Escrow.load(escrowId);
  if (escrow == null) return;

  let wasActive =
    escrow.status != "RELEASED" && escrow.status != "REFUNDED" && escrow.status != "RESOLVED";
  escrow.status = "RESOLVED";
  escrow.save();

  // For simple escrows, dispute ID == escrowAddress.
  // For milestone escrows the AIArbiter fires DisputeResolved with just the escrow
  // address — load the dispute by escrowId (works for simple) or scan milestone
  // disputes. Since milestone IDs are escrowId-{index} we do a best-effort load
  // of the plain escrowId first (covers simple escrows), which is the common case.
  let dispute = Dispute.load(escrowId);
  if (dispute != null) {
    dispute.resolvedAt = event.block.timestamp;
    dispute.resolution = event.params.resolution;
    dispute.save();
  }

  let stats = loadOrCreateGlobalStats();
  stats.resolvedDisputes = stats.resolvedDisputes.plus(BigInt.fromI32(1));
  if (wasActive) {
    stats.activeEscrows = stats.activeEscrows.minus(BigInt.fromI32(1));
  }
  if (stats.totalEscrows.gt(BigInt.fromI32(0))) {
    stats.disputeRate = stats.totalDisputes
      .toBigDecimal()
      .div(stats.totalEscrows.toBigDecimal());
  }
  stats.save();
}
