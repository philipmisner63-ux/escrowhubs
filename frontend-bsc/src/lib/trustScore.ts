/**
 * Off-chain trust score computation.
 *
 * Until the TrustScoreOracle is deployed and an indexer is available,
 * trust scores are computed locally from available signals.
 *
 * Scoring breakdown (0–100):
 *   - Transaction amount:    up to 30 pts (inverse — lower amount = higher trust for new wallets)
 *   - Wallet connection:     +20 pts (wallet is connected)
 *   - Address format:        +10 pts (valid 0x address)
 *   - Known address history: future signal (requires chain data)
 *
 * Tier mapping:
 *   80–100 → Tier 2: Full      (minimal friction, large amounts trusted)
 *   50–79  → Tier 1: Enhanced  (additional confirmation step)
 *   0–49   → Tier 0: Standard  (full verification flow)
 */

export type TrustTier = 0 | 1 | 2;

export interface TrustScore {
  score: number;
  tier: TrustTier;
  label: "Standard" | "Enhanced" | "Full";
  description: string;
}

const TIER_LABELS: Record<TrustTier, TrustScore["label"]> = {
  0: "Standard",
  1: "Enhanced",
  2: "Full",
};

const TIER_DESCRIPTIONS: Record<TrustTier, string> = {
  0: "New wallet or high-value transaction. Full verification required.",
  1: "Moderate trust. Additional confirmation step required.",
  2: "Established wallet with clean history. Minimal friction.",
};

export function computeTrustScore(params: {
  walletAddress?: string;
  amountEth?: number;
  isConnected?: boolean;
}): TrustScore {
  const { walletAddress, amountEth = 0, isConnected = false } = params;

  let score = 0;

  // Wallet connected: +20
  if (isConnected) score += 20;

  // Valid address format: +10
  if (walletAddress && /^0x[0-9a-fA-F]{40}$/.test(walletAddress)) score += 10;

  // Amount-based scoring (inverse scale — larger amounts = more scrutiny)
  // 0–0.1 ETH:    +30 pts
  // 0.1–1 ETH:    +20 pts
  // 1–10 ETH:    +10 pts
  // 10+ ETH:      +0 pts
  if (amountEth <= 0.1)      score += 30;
  else if (amountEth <= 1.0) score += 20;
  else if (amountEth <= 10)  score += 10;

  // Baseline trust for simply having a wallet address: +40
  // (simulates positive chain history — will be replaced by oracle data)
  if (walletAddress) score += 40;

  score = Math.min(100, score);

  const tier: TrustTier = score >= 80 ? 2 : score >= 50 ? 1 : 0;

  return {
    score,
    tier,
    label: TIER_LABELS[tier],
    description: TIER_DESCRIPTIONS[tier],
  };
}

export function tierColor(tier: TrustTier): string {
  const map: Record<TrustTier, string> = {
    2: "text-green-400",
    1: "text-yellow-400",
    0: "text-red-400",
  };
  return map[tier];
}

export function tierBadgeClass(tier: TrustTier): string {
  const map: Record<TrustTier, string> = {
    2: "text-green-400 bg-green-400/10 border-green-400/20",
    1: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    0: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[tier];
}
