// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleEscrow
 * @notice Single-release escrow supporting both native ETH and ERC-20 tokens.
 *         token == address(0) → native ETH (original behaviour, unchanged).
 *         token != address(0) → ERC-20 (e.g. USDC on Base).
 */
contract SimpleEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }

    address public immutable depositor;
    address public immutable beneficiary;
    address public immutable arbiter;
    /// @notice ERC-20 token address, or address(0) for native ETH.
    address public immutable token;

    uint256 public amount;
    State   public state;

    event Deposited(address indexed depositor, uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event Disputed(address indexed by);

    modifier onlyDepositor() { require(msg.sender == depositor, "Not depositor"); _; }
    modifier onlyArbiter()   { require(msg.sender == arbiter,   "Not arbiter");   _; }
    modifier inState(State _s) { require(state == _s, "Invalid state"); _; }

    constructor(
        address _depositor,
        address _beneficiary,
        address _arbiter,
        address _token
    ) {
        require(_depositor   != address(0), "Invalid depositor");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_arbiter     != address(0), "Invalid arbiter");
        depositor   = _depositor;
        beneficiary = _beneficiary;
        arbiter     = _arbiter;
        token       = _token;
        state       = State.AWAITING_PAYMENT;
    }

    /// @notice Fund the escrow. For ETH: send value. For ERC-20: factory has already
    ///         transferred tokens to this contract; just record the amount.
    function deposit(uint256 _amount) external payable inState(State.AWAITING_PAYMENT) {
        require(_amount > 0, "Must deposit > 0");
        if (token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "Do not send ETH for token escrow");
            // Tokens are transferred by factory before calling this; verify balance.
            require(IERC20(token).balanceOf(address(this)) >= _amount, "Token not received");
        }
        amount = _amount;
        state  = State.AWAITING_DELIVERY;
        emit Deposited(msg.sender, _amount);
    }

    function release() external onlyDepositor inState(State.AWAITING_DELIVERY) nonReentrant {
        state = State.COMPLETE;
        emit Released(beneficiary, amount);
        _transfer(beneficiary, amount);
    }

    function dispute() external onlyDepositor inState(State.AWAITING_DELIVERY) {
        state = State.DISPUTED;
        emit Disputed(msg.sender);
    }

    function resolveRelease() external onlyArbiter inState(State.DISPUTED) nonReentrant {
        state = State.COMPLETE;
        emit Released(beneficiary, amount);
        _transfer(beneficiary, amount);
    }

    function resolveRefund() external onlyArbiter inState(State.DISPUTED) nonReentrant {
        state = State.REFUNDED;
        emit Refunded(depositor, amount);
        _transfer(depositor, amount);
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
