import { BigInt } from "@graphprotocol/graph-ts";
import { ScoreUpdated } from "../generated/TrustScoreOracle/TrustScoreOracle";
import { TrustScoreChange, WalletTrustScore } from "../generated/schema";

export function handleScoreUpdated(event: ScoreUpdated): void {
  let walletId = event.params.wallet.toHexString();

  // Determine previous score from the current WalletTrustScore record
  let walletScore = WalletTrustScore.load(walletId);
  let previousScore: i32 = 0;
  if (walletScore == null) {
    walletScore = new WalletTrustScore(walletId);
    walletScore.wallet = event.params.wallet;
  } else {
    previousScore = walletScore.currentScore;
  }

  let changeId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let change = new TrustScoreChange(changeId);
  change.wallet = event.params.wallet;
  change.newScore = event.params.score;
  change.previousScore = previousScore;
  change.timestamp = event.block.timestamp;
  change.txHash = event.transaction.hash;
  change.save();

  walletScore.currentScore = event.params.score;
  walletScore.lastUpdated = event.block.timestamp;
  walletScore.save();
}
