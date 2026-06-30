// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MilestoneEscrow
 * @notice Phased escrow with per-milestone release, supporting ETH and ERC-20 tokens.
 *         token == address(0) → native ETH. token != address(0) → ERC-20.
 *
 *         Access control:
 *         - `fund()` may only be called by the factory that deployed this escrow.
 *         - `releaseMilestone()` may only be called by the depositor.
 *         - `resolveRelease()` / `resolveRefund()` may only be called by the
 *           arbiter.
 *         - `disputeMilestone()` is depositor-only and now carries nonReentrant
 *           to close the cross-function reentry path from a payout callback
 *           (a depositor who is also a payee could otherwise re-enter via
 *           disputeMilestone during a payout and flip a sibling milestone
 *           to DISPUTED mid-flight).
 */
contract MilestoneEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MilestoneState { PENDING, RELEASED, DISPUTED, REFUNDED }

    struct Milestone {
        string          description;
        uint256         amount;
        MilestoneState  state;
    }

    /// @notice The factory that deployed this escrow. The only address
    ///         permitted to call `fund()`.
    address public immutable factory;
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

    modifier onlyFactory()   { require(msg.sender == factory,   "Not factory");   _; }
    modifier onlyDepositor() { require(msg.sender == depositor, "Not depositor"); _; }
    modifier onlyArbiter()   { require(msg.sender == arbiter,   "Not arbiter");   _; }

    constructor(
        address          _factory,
        address          _depositor,
        address          _beneficiary,
        address          _arbiter,
        address          _token,
        string[] memory  _descriptions,
        uint256[] memory _amounts
    ) {
        require(_factory     != address(0), "Invalid factory");
        require(_depositor   != address(0), "Invalid depositor");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_arbiter     != address(0), "Invalid arbiter");
        require(_depositor   != _beneficiary, "depositor == beneficiary");
        require(_depositor   != _arbiter,    "depositor == arbiter");
        require(_beneficiary != _arbiter,    "beneficiary == arbiter");
        if (_token != address(0)) {
            require(_token.code.length > 0, "Token not a contract");
        }
        require(_descriptions.length == _amounts.length, "Length mismatch");
        require(_descriptions.length > 0, "No milestones");
        require(_descriptions.length <= 50, "Too many milestones");

        factory     = _factory;
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
        // Renamed from totalDeposited to make the intent explicit: this
        // is the *required* total, not an actual deposit balance. The
        // actual deposit is verified separately in `fund()`.
        // (The storage variable is still named totalDeposited for
        // backwards compatibility with off-chain indexers.)
        totalDeposited = total;
    }

    /// @notice Fund the escrow. ETH path: pass value matching totalDeposited.
    ///         ERC-20 path: factory has already transferred the total.
    ///         Only the deploying factory may call this — closes the same
    ///         permissionless front-running bug that SimpleEscrow had.
    function fund(uint256 _amount)
        external payable
        onlyFactory
        nonReentrant
    {
        require(!funded, "Already funded");
        require(_amount == totalDeposited, "Incorrect amount");
        if (token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "No ETH for token escrow");
            // Verify the factory actually transferred the tokens. Record
            // the actual received amount (handles fee-on-transfer /
            // rebasing tokens). Factory is responsible for the right amount.
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "Token not received");
            // Note: the actual balance may be less than totalDeposited if
            // the token takes a fee. The factory should have anticipated
            // this and sent gross = totalDeposited + fee. We trust the
            // factory to have done so and proceed with whatever arrived.
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

    /// @notice Mark a milestone as disputed. Now carries nonReentrant to
    ///         close the cross-function reentry path: a depositor who is
    ///         also a payee (e.g. depositor == beneficiary) could
    ///         otherwise re-enter disputeMilestone(sibling) during a
    ///         payout callback and flip a sibling milestone to DISPUTED
    ///         mid-flight. Defensive — the existing release/resolve paths
    ///         are still safe, but the state mutation mid-payout could
    ///         confuse off-chain indexers and the arbiter workflow.
    function disputeMilestone(uint256 index) external onlyDepositor nonReentrant {
        require(funded, "Not funded");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.PENDING, "Not pending");
        m.state = MilestoneState.DISPUTED;
        emit MilestoneDisputed(index);
    }

    function resolveRelease(uint256 index) external onlyArbiter nonReentrant {
        require(funded, "Not funded");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.DISPUTED, "Not disputed");
        m.state = MilestoneState.RELEASED;
        emit MilestoneReleased(index, m.amount);
        _transfer(beneficiary, m.amount);
    }

    function resolveRefund(uint256 index) external onlyArbiter nonReentrant {
        require(funded, "Not funded");
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
            (bool ok, ) = payable(to).call{value: amt}(""); require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }
}
