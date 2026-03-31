// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MilestoneEscrow
 * @notice Phased escrow with per-milestone release. Each milestone has an amount
 *         and can be released independently once marked complete by the depositor.
 * @dev Adaptive verification layers are enforced off-chain via trust score;
 *      on-chain, the arbiter role handles dispute resolution per milestone.
 */
contract MilestoneEscrow is ReentrancyGuard {
    enum MilestoneState { PENDING, RELEASED, DISPUTED, REFUNDED }

    struct Milestone {
        string          description;
        uint256         amount;
        MilestoneState  state;
    }

    address public immutable depositor;
    address public immutable beneficiary;
    address public immutable arbiter;

    Milestone[] public milestones;
    uint256     public totalDeposited;
    bool        public funded;

    event Funded(uint256 total);
    event MilestoneReleased(uint256 indexed index, uint256 amount);
    event MilestoneDisputed(uint256 indexed index);
    event MilestoneRefunded(uint256 indexed index, uint256 amount);

    modifier onlyDepositor() { require(msg.sender == depositor, "Not depositor"); _; }
    modifier onlyArbiter()   { require(msg.sender == arbiter,   "Not arbiter");   _; }

    constructor(
        address          _depositor,
        address          _beneficiary,
        address          _arbiter,
        string[] memory  _descriptions,
        uint256[] memory _amounts
    ) {
        require(_depositor   != address(0), "Invalid depositor");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_arbiter     != address(0), "Invalid arbiter");
        require(_descriptions.length == _amounts.length, "Length mismatch");
        require(_descriptions.length > 0, "No milestones");

        depositor   = _depositor;
        beneficiary = _beneficiary;
        arbiter     = _arbiter;

        uint256 total;
        for (uint256 i; i < _descriptions.length; i++) {
            require(_amounts[i] > 0, "Milestone amount must be > 0");
            milestones.push(Milestone({
                description: _descriptions[i],
                amount:      _amounts[i],
                state:       MilestoneState.PENDING
            }));
            total += _amounts[i];
        }
        totalDeposited = total;
    }

    function fund() external payable {
        require(!funded, "Already funded");
        require(msg.value == totalDeposited, "Incorrect amount");
        funded = true;
        emit Funded(msg.value);
    }

    function releaseMilestone(uint256 index) external onlyDepositor nonReentrant {
        require(funded, "Not funded");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.PENDING, "Not pending");
        m.state = MilestoneState.RELEASED;
        emit MilestoneReleased(index, m.amount);
        payable(beneficiary).transfer(m.amount);
    }

    function disputeMilestone(uint256 index) external onlyDepositor {
        require(funded, "Not funded");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.PENDING, "Not pending");
        m.state = MilestoneState.DISPUTED;
        emit MilestoneDisputed(index);
    }

    function resolveRelease(uint256 index) external onlyArbiter nonReentrant {
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.DISPUTED, "Not disputed");
        m.state = MilestoneState.RELEASED;
        emit MilestoneReleased(index, m.amount);
        payable(beneficiary).transfer(m.amount);
    }

    function resolveRefund(uint256 index) external onlyArbiter nonReentrant {
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.DISPUTED, "Not disputed");
        m.state = MilestoneState.REFUNDED;
        emit MilestoneRefunded(index, m.amount);
        payable(depositor).transfer(m.amount);
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }
}
