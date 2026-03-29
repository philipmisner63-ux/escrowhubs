// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleEscrow
 * @notice Single-release escrow between a depositor and a beneficiary.
 *         An arbiter can resolve disputes.
 * @dev Adaptive verification: arbiter threshold scales with trust score (off-chain).
 */
contract SimpleEscrow is ReentrancyGuard {
    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }

    address public immutable depositor;
    address public immutable beneficiary;
    address public immutable arbiter;

    uint256 public amount;
    State   public state;

    event Deposited(address indexed depositor, uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event Disputed(address indexed by);

    modifier onlyDepositor() { require(msg.sender == depositor, "Not depositor"); _; }
    modifier onlyArbiter()   { require(msg.sender == arbiter,   "Not arbiter");   _; }
    modifier inState(State _s) { require(state == _s, "Invalid state"); _; }

    constructor(address _beneficiary, address _arbiter) {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_arbiter     != address(0), "Invalid arbiter");
        depositor   = msg.sender;
        beneficiary = _beneficiary;
        arbiter     = _arbiter;
        state       = State.AWAITING_PAYMENT;
    }

    function deposit() external payable onlyDepositor inState(State.AWAITING_PAYMENT) {
        require(msg.value > 0, "Must deposit > 0");
        amount = msg.value;
        state  = State.AWAITING_DELIVERY;
        emit Deposited(msg.sender, msg.value);
    }

    function release() external onlyDepositor inState(State.AWAITING_DELIVERY) nonReentrant {
        state = State.COMPLETE;
        emit Released(beneficiary, amount);
        payable(beneficiary).transfer(amount);
    }

    function dispute() external onlyDepositor inState(State.AWAITING_DELIVERY) {
        state = State.DISPUTED;
        emit Disputed(msg.sender);
    }

    function resolveRelease() external onlyArbiter inState(State.DISPUTED) nonReentrant {
        state = State.COMPLETE;
        emit Released(beneficiary, amount);
        payable(beneficiary).transfer(amount);
    }

    function resolveRefund() external onlyArbiter inState(State.DISPUTED) nonReentrant {
        state = State.REFUNDED;
        emit Refunded(depositor, amount);
        payable(depositor).transfer(amount);
    }
}
