// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
contract TrustScoreOracle {

    address public owner;
    uint8   public tier2Threshold = 80;
    uint8   public tier1Threshold = 50;

    /// wallet → score (0–100)
    mapping(address => uint8) public scores;

    event ScoreUpdated(address indexed wallet, uint8 score);
    event ThresholdsUpdated(uint8 tier1, uint8 tier2);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor() { owner = msg.sender; }

    // ─── Oracle writes ────────────────────────────────────────────────────────

    function setScore(address wallet, uint8 score) external onlyOwner {
        require(score <= 100, "Score > 100");
        scores[wallet] = score;
        emit ScoreUpdated(wallet, score);
    }

    function setScoreBatch(address[] calldata wallets, uint8[] calldata _scores)
        external onlyOwner
    {
        require(wallets.length == _scores.length, "Length mismatch");
        for (uint256 i; i < wallets.length; i++) {
            require(_scores[i] <= 100, "Score > 100");
            scores[wallets[i]] = _scores[i];
            emit ScoreUpdated(wallets[i], _scores[i]);
        }
    }

    function setThresholds(uint8 tier1, uint8 tier2) external onlyOwner {
        require(tier1 < tier2, "tier1 must be < tier2");
        tier1Threshold = tier1;
        tier2Threshold = tier2;
        emit ThresholdsUpdated(tier1, tier2);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getTier(address wallet) external view returns (uint8) {
        uint8 s = scores[wallet];
        if (s >= tier2Threshold) return 2; // Full
        if (s >= tier1Threshold) return 1; // Enhanced
        return 0;                           // Standard
    }

    function getScoreAndTier(address wallet)
        external view returns (uint8 score, uint8 tier)
    {
        score = scores[wallet];
        if (score >= tier2Threshold) tier = 2;
        else if (score >= tier1Threshold) tier = 1;
        else tier = 0;
    }
}
