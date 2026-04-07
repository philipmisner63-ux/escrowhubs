import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  SimpleEscrowCreated,
  MilestoneEscrowCreated,
} from "../generated/EscrowFactory/EscrowFactory";
import {
  SimpleEscrow as SimpleEscrowTemplate,
  MilestoneEscrow as MilestoneEscrowTemplate,
} from "../generated/templates";
import { Escrow, GlobalStats } from "../generated/schema";

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

export function handleSimpleEscrowCreated(event: SimpleEscrowCreated): void {
  let id = event.params.contractAddress.toHexString();
  let escrow = new Escrow(id);
  escrow.type = "simple";
  escrow.buyer = event.params.depositor;
  escrow.seller = event.params.beneficiary;
  escrow.arbiter = event.params.arbiter;
  escrow.token = event.params.token;
  escrow.amount = event.params.amount;
  escrow.fee = event.params.fee;
  escrow.trustTier = event.params.trustTier;
  escrow.status = "CREATED";
  escrow.useAIArbiter = event.params.aiArbiter;
  escrow.createdAt = event.block.timestamp;
  escrow.txHash = event.transaction.hash;
  escrow.blockNumber = event.block.number;
  escrow.save();

  SimpleEscrowTemplate.create(event.params.contractAddress);

  let stats = loadOrCreateGlobalStats();
  stats.totalEscrows = stats.totalEscrows.plus(BigInt.fromI32(1));
  stats.totalVolume = stats.totalVolume.plus(event.params.amount);
  stats.activeEscrows = stats.activeEscrows.plus(BigInt.fromI32(1));
  if (stats.totalEscrows.gt(BigInt.fromI32(0))) {
    stats.disputeRate = stats.totalDisputes
      .toBigDecimal()
      .div(stats.totalEscrows.toBigDecimal());
  }
  stats.save();
}

export function handleMilestoneEscrowCreated(
  event: MilestoneEscrowCreated
): void {
  let id = event.params.contractAddress.toHexString();
  let escrow = new Escrow(id);
  escrow.type = "milestone";
  escrow.buyer = event.params.depositor;
  escrow.seller = event.params.beneficiary;
  escrow.arbiter = event.params.arbiter;
  escrow.token = event.params.token;
  escrow.amount = event.params.totalAmount;
  escrow.fee = event.params.fee;
  escrow.trustTier = event.params.trustTier;
  escrow.status = "CREATED";
  escrow.useAIArbiter = event.params.aiArbiter;
  escrow.createdAt = event.block.timestamp;
  escrow.txHash = event.transaction.hash;
  escrow.blockNumber = event.block.number;
  escrow.save();

  MilestoneEscrowTemplate.create(event.params.contractAddress);

  let stats = loadOrCreateGlobalStats();
  stats.totalEscrows = stats.totalEscrows.plus(BigInt.fromI32(1));
  stats.totalVolume = stats.totalVolume.plus(event.params.totalAmount);
  stats.activeEscrows = stats.activeEscrows.plus(BigInt.fromI32(1));
  if (stats.totalEscrows.gt(BigInt.fromI32(0))) {
    stats.disputeRate = stats.totalDisputes
      .toBigDecimal()
      .div(stats.totalEscrows.toBigDecimal());
  }
  stats.save();
}
