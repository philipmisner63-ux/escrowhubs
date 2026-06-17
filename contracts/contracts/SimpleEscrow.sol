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
 *
 *         Access control:
 *         - `deposit()` may only be called by the factory that deployed this
 *           escrow. The factory address is stored as an immutable.
 *         - `release()` may only be called by the depositor.
 *         - `resolveRelease()` / `resolveRefund()` may only be called by the
 *           arbiter.
 *         - The factory-only guard on `deposit` prevents the previous
 *           front-running bug where anyone could call `deposit(1)` after
 *           the factory had pre-funded the contract with 1000 USDC and
 *           strand 999 of them permanently.
 */
contract SimpleEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }

    /// @notice The factory that deployed this escrow. The only address
    ///         permitted to call `deposit()`.
    address public immutable factory;
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

    modifier onlyFactory()   { require(msg.sender == factory,   "Not factory");   _; }
    modifier onlyDepositor() { require(msg.sender == depositor, "Not depositor"); _; }
    modifier onlyArbiter()   { require(msg.sender == arbiter,   "Not arbiter");   _; }
    modifier inState(State _s) { require(state == _s, "Invalid state"); _; }

    constructor(
        address _factory,
        address _depositor,
        address _beneficiary,
        address _arbiter,
        address _token
    ) {
        require(_factory    != address(0), "Invalid factory");
        require(_depositor  != address(0), "Invalid depositor");
        require(_beneficiary!= address(0), "Invalid beneficiary");
        require(_arbiter    != address(0), "Invalid arbiter");
        require(_depositor  != _beneficiary, "depositor == beneficiary");
        require(_depositor  != _arbiter,    "depositor == arbiter");
        require(_beneficiary!= _arbiter,    "beneficiary == arbiter");
        if (_token != address(0)) {
            require(_token.code.length > 0, "Token not a contract");
        }
        factory    = _factory;
        depositor  = _depositor;
        beneficiary= _beneficiary;
        arbiter    = _arbiter;
        token      = _token;
        state      = State.AWAITING_PAYMENT;
    }

    /// @notice Fund the escrow. ETH path: pass value matching `_amount`.
    ///         ERC-20 path: factory has already transferred tokens to this
    ///         contract via `safeTransfer`. We verify the balance and record
    ///         the actual received amount (handles fee-on-transfer / rebasing
    ///         tokens correctly: we record what actually arrived, not what
    ///         the factory asked for).
    ///         Only the deploying factory may call this — closes the
    ///         mempool front-running bug that could strand surplus tokens.
    ///         The factory is responsible for transferring the tokens; we
    ///         do NOT pull via `safeTransferFrom` here because that would
    ///         require the factory to have an allowance from the depositor,
    ///         which is not how the factory's flow works.
    function deposit(uint256 _amount)
        external payable
        onlyFactory
        inState(State.AWAITING_PAYMENT)
        nonReentrant
    {
        require(_amount > 0, "Must deposit > 0");
        if (token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
            amount = _amount;
        } else {
            require(msg.value == 0, "No ETH for token escrow");
            // Verify the factory actually transferred the tokens. Record the
            // actual received amount (not the requested) so fee-on-transfer
            // and rebasing tokens don't desync the accounting. The factory
            // is responsible for ensuring the right amount is sent.
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "Token not received");
            amount = balance;
        }
        state = State.AWAITING_DELIVERY;
        emit Deposited(depositor, amount);
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
            (bool ok, ) = payable(to).call{value: amt}(""); require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }
}
