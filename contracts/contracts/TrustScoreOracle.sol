// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title TrustScoreOracle
 * @notice Stores trust scores submitted by an off-chain oracle (or the owner).
 *         The factory reads from this to determine the verification tier at deploy time.
 *
 *         Tier thresholds (configurable):
 *           score >= 80  → Tier 2: Full verification
 *           score >= 50  → Tier 1: Enhanced verification
 *           score <  50  → Tier 0: Standard verification
 *
 * @dev In production this would be updated by a Chainlink job or similar.
 *      For testnet, the owner can set scores manually.
 */
contract TrustScoreOracle is Ownable2Step {
    uint8   public tier2Threshold = 80;
    uint8   public tier1Threshold = 50;

    /// wallet → score (0–100)
    mapping(address => uint8) public scores;

    event ScoreUpdated(address indexed wallet, uint8 score);
    event ThresholdsUpdated(uint8 tier1, uint8 tier2);

    /// @param initialOwner  The intended admin address. Required — passing address(0)
    ///                      reverts. Replaces the previous `owner = msg.sender` pattern
    ///                      that trapped factory deployers as permanent owners.
    ///                      Ownable2Step provides two-step transferOwnership so a
    ///                      typo can't permanently brick the oracle.
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ─── Oracle writes ────────────────────────────────────────────────────────

    function setScore(address wallet, uint8 score) external onlyOwner {
        require(wallet != address(0), "Invalid wallet");
        require(score <= 100, "Score > 100");
        scores[wallet] = score;
        emit ScoreUpdated(wallet, score);
    }

    function setScoreBatch(address[] calldata wallets, uint8[] calldata _scores)
        external onlyOwner
    {
        require(wallets.length == _scores.length, "Length mismatch");
        require(wallets.length <= 200, "Batch too large");
        for (uint256 i; i < wallets.length; i++) {
            require(wallets[i] != address(0), "Invalid wallet");
            require(_scores[i] <= 100, "Score > 100");
            scores[wallets[i]] = _scores[i];
            emit ScoreUpdated(wallets[i], _scores[i]);
        }
    }

    /// @notice Set the tier thresholds. Both must be in [1, 100] and tier1 < tier2.
    ///         Capping at 100 prevents the previous bug where setting tier1 = 101
    ///         made both tiers permanently unreachable.
    function setThresholds(uint8 tier1, uint8 tier2) external onlyOwner {
        require(tier1 > 0 && tier1 <= 100, "tier1 out of [1, 100]");
        require(tier2 > 0 && tier2 <= 100, "tier2 out of [1, 100]");
        require(tier1 < tier2, "tier1 must be < tier2");
        tier1Threshold = tier1;
        tier2Threshold = tier2;
        emit ThresholdsUpdated(tier1, tier2);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getTier(address wallet) external view returns (uint8) {
        return _tierFor(scores[wallet]);
    }

    function getScoreAndTier(address wallet)
        external view returns (uint8 score, uint8 tier)
    {
        score = scores[wallet];
        tier  = _tierFor(score);
    }

    function _tierFor(uint8 score) private view returns (uint8) {
        if (score >= tier2Threshold) return 2; // Full
        if (score >= tier1Threshold) return 1; // Enhanced
        return 0;                              // Standard
    }
}
