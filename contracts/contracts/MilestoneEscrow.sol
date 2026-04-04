// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MilestoneEscrow
 * @notice Phased escrow with per-milestone release, supporting ETH and ERC-20 tokens.
 *         token == address(0) → native ETH. token != address(0) → ERC-20.
 */
contract MilestoneEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MilestoneState { PENDING, RELEASED, DISPUTED, REFUNDED }

    struct Milestone {
        string          description;
        uint256         amount;
        MilestoneState  state;
    }

    address public immutable depositor;
    address public immutable beneficiary;
    address public immutable arbiter;
    /// @notice ERC-20 token address, or address(0) for native ETH.
    address public immutable token;

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
        address          _token,
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
        token       = _token;

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

    /// @notice Fund the escrow. For ETH: send exact value. For ERC-20: factory transfers first.
    function fund(uint256 _amount) external payable {
        require(!funded, "Already funded");
        require(_amount == totalDeposited, "Incorrect amount");
        if (token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "Do not send ETH for token escrow");
            require(IERC20(token).balanceOf(address(this)) >= _amount, "Token not received");
        }
        funded = true;
        emit Funded(_amount);
    }

    function releaseMilestone(uint256 index) external onlyDepositor nonReentrant {
        require(funded, "Not funded");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.PENDING, "Not pending");
        m.state = MilestoneState.RELEASED;
        emit MilestoneReleased(index, m.amount);
        _transfer(beneficiary, m.amount);
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
        _transfer(beneficiary, m.amount);
    }

    function resolveRefund(uint256 index) external onlyArbiter nonReentrant {
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.DISPUTED, "Not disputed");
        m.state = MilestoneState.REFUNDED;
        emit MilestoneRefunded(index, m.amount);
        _transfer(depositor, m.amount);
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    // ─── Internal transfer helper ─────────────────────────────────────────────

    function _transfer(address to, uint256 amt) internal {
        if (token == address(0)) {
            payable(to).transfer(amt);
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }
}
