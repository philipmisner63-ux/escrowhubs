// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SimpleEscrow.sol";
import "./MilestoneEscrow.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EscrowFactory
 * @notice Deploys and indexes all SimpleEscrow and MilestoneEscrow contracts.
 *         Includes a referral system: referrers earn a share of the protocol fee
 *         in BDAG, claimable via the pull pattern.
 */
contract EscrowFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Admin ────────────────────────────────────────────────────────────────

    address public owner;
    address public treasury;

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    // ─── Fees ─────────────────────────────────────────────────────────────────

    /// Protocol fee in basis points (50 = 0.5%, 100 = 1%). Max 500 (5%).
    uint16  public protocolFeeBps  = 50;

    /// Flat fee charged when AI Arbiter is selected (in wei). Default 1 BDAG.
    uint256 public aiArbiterFee    = 1 ether;

    /// Accumulated ETH-denominated protocol fees available for withdrawal
    /// (net of referral kickbacks). For ERC-20 token escrows, fees accumulate
    /// in `accumulatedTokenFees` keyed by the token address, and must be
    /// withdrawn via `withdrawTokenFees(token)`.
    uint256 public accumulatedFees;

    /// Accumulated per-token protocol fees available for withdrawal.
    /// ETH (address(0)) is NOT tracked here — it lives in `accumulatedFees`.
    mapping(address => uint256) public accumulatedTokenFees;

    // ─── Referrals ────────────────────────────────────────────────────────────

    /// Referral share: percentage of protocol fee paid to referrer (basis points).
    /// Default 2000 = 20% of protocol fee. Max 5000 (50%).
    uint16 public referralShareBps = 2000;

    /// Per-referrer share override. If set (>0), used instead of global referralShareBps.
    mapping(address => uint16) public referrerShareBps;

    /// Total gross value of escrows attributed to each referrer (for volume tier tracking)
    mapping(address => uint256) public referralVolume;

    /// Accumulated ETH referral earnings per wallet (claimable via pull pattern).
    /// For ERC-20 token kickbacks, see `referralEarningsByToken`.
    mapping(address => uint256) public referralEarnings;

    /// Accumulated per-token referral earnings per wallet.
    /// referralEarningsByToken[referrer][token] is the claimable balance
    /// of `token` kickbacks owed to `referrer`. ETH (address(0)) lives
    /// in `referralEarnings` instead.
    mapping(address => mapping(address => uint256)) public referralEarningsByToken;

    /// Number of escrows created via each referrer
    mapping(address => uint256) public referralCount;

    /// Total referral earnings ever credited (lifetime, for stats)
    mapping(address => uint256) public referralTotalEarned;

    // ─── AI Arbiter ───────────────────────────────────────────────────────────

    address public aiArbiterAddress;

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner    = msg.sender;
        treasury = msg.sender;
    }

    // ─── Structs ──────────────────────────────────────────────────────────────

    enum EscrowType { SIMPLE, MILESTONE }

    struct EscrowRecord {
        address     contractAddress;
        EscrowType  escrowType;
        address     depositor;
        address     beneficiary;
        address     arbiter;
        uint256     totalAmount;
        uint256     fee;
        uint8       trustTier;
        bool        aiArbiter;
        uint256     createdAt;
        address     referrer;   // address(0) if no referral
        address     token;      // address(0) = native ETH, else ERC-20
    }

    // ─── State ────────────────────────────────────────────────────────────────

    EscrowRecord[] public escrows;

    mapping(address => uint256[]) public escrowsByDepositor;
    mapping(address => uint256[]) public escrowsByBeneficiary;
    mapping(address => uint256)   public escrowIndex;

    // ─── Events ───────────────────────────────────────────────────────────────

    event SimpleEscrowCreated(
        address indexed contractAddress,
        address indexed depositor,
        address indexed beneficiary,
        address         arbiter,
        uint256         amount,
        uint256         fee,
        uint8           trustTier,
        bool            aiArbiter,
        address         token
    );

    event MilestoneEscrowCreated(
        address indexed contractAddress,
        address indexed depositor,
        address indexed beneficiary,
        address         arbiter,
        uint256         totalAmount,
        uint256         fee,
        uint8           trustTier,
        bool            aiArbiter,
        address         token
    );

    event ReferralCredited(address indexed referrer, address indexed escrow, uint256 amount);
    event ReferralClaimed(address indexed referrer, uint256 amount);
    event ReferralTokenClaimed(address indexed referrer, address indexed token, uint256 amount);
    event ReferralShareUpdated(uint16 newShareBps);
    event AIArbiterUpdated(address indexed newAIArbiter);
    event FeesUpdated(uint16 protocolFeeBps, uint256 aiArbiterFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event TokenFeesWithdrawn(address indexed token, address indexed to, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Admin: Fees ──────────────────────────────────────────────────────────

    function setFees(uint16 _protocolFeeBps, uint256 _aiArbiterFee) external onlyOwner {
        require(_protocolFeeBps <= 500, "Fee too high");
        protocolFeeBps = _protocolFeeBps;
        aiArbiterFee   = _aiArbiterFee;
        emit FeesUpdated(_protocolFeeBps, _aiArbiterFee);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "Nothing to withdraw");
        accumulatedFees = 0;
        emit FeesWithdrawn(treasury, amount);
        // Use call{value:} with success check instead of transfer() — the
        // 2,300-gas stipend from .transfer() breaks for smart-contract
        // treasuries (multisigs, governance contracts, future-proofing).
        // nonReentrant guard above prevents the small reentrancy surface
        // that .transfer()'s gas cap used to mitigate.
        (bool ok, ) = payable(treasury).call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    /// @notice Withdraw accumulated protocol fees for a specific ERC-20 token.
    ///         ETH fees are withdrawn via `withdrawFees()`. Calling this
    ///         with `token == address(0)` is rejected to avoid silent loss.
    function withdrawTokenFees(address token) external onlyOwner nonReentrant {
        require(token != address(0), "Use withdrawFees() for ETH");
        uint256 amount = accumulatedTokenFees[token];
        require(amount > 0, "Nothing to withdraw");
        accumulatedTokenFees[token] = 0;
        emit TokenFeesWithdrawn(token, treasury, amount);
        IERC20(token).safeTransfer(treasury, amount);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // ─── Admin: AI Arbiter ────────────────────────────────────────────────────

    function setAIArbiter(address _aiArbiter) external onlyOwner {
        require(_aiArbiter != address(0), "Invalid AIArbiter address");
        aiArbiterAddress = _aiArbiter;
        emit AIArbiterUpdated(_aiArbiter);
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── Admin: Referrals ─────────────────────────────────────────────────────

    /// @notice Update referral share percentage (max 50%).
    function setReferralShare(uint16 _referralShareBps) external onlyOwner {
        require(_referralShareBps <= 5000, "Max 50%");
        referralShareBps = _referralShareBps;
        emit ReferralShareUpdated(_referralShareBps);
    }

    /// @notice Set a per-referrer share override. Set to 0 to use global rate.
    function setReferrerShare(address referrer, uint16 _bps) external onlyOwner {
        require(_bps <= 5000, "Max 50%");
        referrerShareBps[referrer] = _bps;
        emit ReferralShareUpdated(_bps);
    }

    // ─── Referral: claim ──────────────────────────────────────────────────────

    /// @notice Referrers call this to withdraw accumulated ETH kickback earnings.
    ///         For ERC-20 token kickbacks, use `claimReferralEarnings(address token)`.
    function claimReferralEarnings() external nonReentrant {
        uint256 earned = referralEarnings[msg.sender];
        require(earned > 0, "No earnings");
        referralEarnings[msg.sender] = 0;
        emit ReferralClaimed(msg.sender, earned);
        // call{value:} instead of .transfer() — see withdrawFees() for rationale.
        (bool ok, ) = payable(msg.sender).call{value: earned}("");
        require(ok, "ETH transfer failed");
    }

    /// @notice Referrers call this to withdraw accumulated ERC-20 token kickback
    ///         earnings for a specific token. ETH is claimed via the no-arg overload.
    function claimReferralEarnings(address token) external nonReentrant {
        require(token != address(0), "Use claimReferralEarnings() for ETH");
        uint256 earned = referralEarningsByToken[msg.sender][token];
        require(earned > 0, "No earnings");
        referralEarningsByToken[msg.sender][token] = 0;
        emit ReferralTokenClaimed(msg.sender, token, earned);
        IERC20(token).safeTransfer(msg.sender, earned);
    }

    /// @notice Get the claimable ERC-20 token kickback balance for a referrer.
    function getTokenReferralEarnings(address referrer, address token) external view returns (uint256) {
        return referralEarningsByToken[referrer][token];
    }

    /// @notice Get referral stats for a wallet.
    function getReferralStats(address wallet)
        external view
        returns (uint256 count, uint256 volume, uint256 earned, uint256 claimable, uint16 shareBps)
    {
        count     = referralCount[wallet];
        volume    = referralVolume[wallet];
        earned    = referralTotalEarned[wallet];
        claimable = referralEarnings[wallet];
        shareBps  = referrerShareBps[wallet] > 0 ? referrerShareBps[wallet] : referralShareBps;
    }

    // ─── Internal: fee calculation ────────────────────────────────────────────

    function _computeFee(uint256 value, bool _useAIArbiter)
        internal view returns (uint256 netAmount, uint256 totalFee)
    {
        uint256 protocolFee = (value * protocolFeeBps) / 10_000;
        uint256 arbiterFee  = _useAIArbiter ? aiArbiterFee : 0;
        totalFee  = protocolFee + arbiterFee;
        require(value > totalFee, "Amount too low to cover fees");
        netAmount = value - totalFee;
    }

    /// @dev Compute and record referral kickback. Returns the kickback amount.
    /// @param token  The escrow's payment token. address(0) means ETH.
    ///               The kickback is debited from the per-token (or ETH) fee
    ///               pool and credited to the referrer's per-token (or ETH)
    ///               earnings map, so the two accounting streams never cross.
    /// State changes happen BEFORE any external calls (CEI pattern).
    function _recordReferralKickback(address referrer, uint256 grossValue, uint256 fee, address token)
        internal returns (uint256 kickback)
    {
        if (referrer == address(0) || referrer == msg.sender) return 0;
        // Combine multiplications before dividing to avoid precision loss
        uint16 effectiveShareBps = referrerShareBps[referrer] > 0 ? referrerShareBps[referrer] : referralShareBps;
        kickback = (grossValue * protocolFeeBps * effectiveShareBps) / (10_000 * 10_000);
        if (kickback == 0 || kickback > fee) return 0;
        if (token == address(0)) {
            // ETH path: debit ETH fee pool, credit ETH earnings.
            accumulatedFees -= kickback;
            referralEarnings[referrer] += kickback;
        } else {
            // ERC-20 path: debit the token fee pool, credit the token earnings.
            // The corresponding fee was added to accumulatedTokenFees[token]
            // by the caller (see createSimpleEscrow / createMilestoneEscrow).
            accumulatedTokenFees[token] -= kickback;
            referralEarningsByToken[referrer][token] += kickback;
        }
        // Cross-token lifetime stats — these are aggregate counters, no
        // accounting implication, so they live in the same slot for both paths.
        referralTotalEarned[referrer] += kickback;
        referralCount[referrer]       += 1;
        referralVolume[referrer]      += grossValue;
    }

    /// @dev Push record to storage and update indexes.
    function _registerEscrow(EscrowRecord memory rec) internal {
        uint256 idx = escrows.length;
        escrows.push(rec);
        escrowsByDepositor[rec.depositor].push(idx);
        escrowsByBeneficiary[rec.beneficiary].push(idx);
        escrowIndex[rec.contractAddress] = idx + 1;
    }

    // ─── Deploy: SimpleEscrow ─────────────────────────────────────────────────

    function createSimpleEscrow(
        address beneficiary,
        address arbiter,
        uint8   trustTier,
        bool    useAIArbiter,
        address token,
        address referrer
    ) external payable nonReentrant returns (address escrowOut) {
        require(trustTier <= 2, "Invalid trust tier");
        if (token == address(0)) {
            require(msg.value > 0, "Must send ETH");
        } else {
            require(msg.value == 0, "Do not send ETH for token escrow");
        }

        EscrowRecord memory rec;
        rec.escrowType  = EscrowType.SIMPLE;
        rec.depositor   = msg.sender;
        rec.beneficiary = beneficiary;
        rec.trustTier   = trustTier;
        rec.aiArbiter   = useAIArbiter;
        rec.referrer    = referrer;
        rec.createdAt   = block.timestamp;
        rec.token       = token;

        {
            address ra = useAIArbiter ? aiArbiterAddress : arbiter;
            require(ra != address(0), "Arbiter not set");
            rec.arbiter = ra;

            if (token == address(0)) {
                // Native ETH path
                (uint256 net, uint256 fee) = _computeFee(msg.value, useAIArbiter);
                accumulatedFees += fee;
                uint256 kickback = _recordReferralKickback(referrer, msg.value, fee, address(0));
                rec.totalAmount = net;
                rec.fee = fee;

                SimpleEscrow esc = new SimpleEscrow(address(this), msg.sender, beneficiary, ra, address(0));
                rec.contractAddress = address(esc);
                // Register the escrow record BEFORE the payable deposit so any
                // observer of view functions (off-chain indexers, integrators)
                // never sees a state where funds are in flight but no record
                // exists. With nonReentrant guarding the function, this also
                // closes the read-only reentrancy window for the child escrow.
                _registerEscrow(rec);
                esc.deposit{ value: net }(net);
                if (kickback > 0) emit ReferralCredited(referrer, rec.contractAddress, kickback);
            } else {
                // ERC-20 path: fee charged in tokens
                uint256 gross = IERC20(token).allowance(msg.sender, address(this));
                require(gross > 0, "No token allowance");
                // Compute fee BEFORE any external call (CEI pattern)
                uint256 fee = (gross * protocolFeeBps) / 10_000;
                if (useAIArbiter) fee += aiArbiterFee;
                require(gross > fee, "Amount too low to cover fees");
                uint256 net = gross - fee;
                // Update state BEFORE external call. Per-token accounting keeps
                // ERC-20 fees separate from the ETH fee pool, so they can be
                // withdrawn via withdrawTokenFees(token).
                accumulatedTokenFees[token] += fee;
                uint256 kickback = _recordReferralKickback(referrer, gross, fee, token);
                rec.totalAmount = net;
                rec.fee = fee;

                // Deploy the child escrow first so we have its address.
                SimpleEscrow esc = new SimpleEscrow(address(this), msg.sender, beneficiary, ra, token);
                rec.contractAddress = address(esc);
                // Register the escrow record BEFORE the token transfers. This
                // closes the read-only reentrancy window for ERC-777 / callback
                // tokens: any token-transfer hook that calls getEscrows() will
                // see the new record, not an in-flight state.
                _registerEscrow(rec);
                // External calls after all state updates
                IERC20(token).safeTransferFrom(msg.sender, address(this), gross);
                IERC20(token).safeTransfer(address(esc), net);
                // deposit() is now onlyFactory + nonReentrant + uses measured
                // delta so fee-on-transfer / rebasing tokens are handled correctly.
                esc.deposit(net);
                if (kickback > 0) emit ReferralCredited(referrer, rec.contractAddress, kickback);
            }
        }

        emit SimpleEscrowCreated(rec.contractAddress, msg.sender, beneficiary, rec.arbiter, rec.totalAmount, rec.fee, trustTier, useAIArbiter, token);
        return rec.contractAddress;
    }

    // ─── Deploy: MilestoneEscrow ──────────────────────────────────────────────

    function createMilestoneEscrow(
        address          beneficiary,
        address          arbiter,
        string[] memory  descriptions,
        uint256[] memory amounts,
        uint8            trustTier,
        bool             useAIArbiter,
        address          token,
        address          referrer
    ) external payable nonReentrant returns (address escrowOut) {
        require(trustTier <= 2, "Invalid trust tier");
        require(descriptions.length == amounts.length, "Length mismatch");
        require(descriptions.length > 0, "No milestones");
        require(descriptions.length <= 50, "Too many milestones");
        if (token == address(0)) {
            require(msg.value > 0, "Must send ETH");
        } else {
            require(msg.value == 0, "Do not send ETH for token escrow");
        }

        EscrowRecord memory rec;
        rec.escrowType  = EscrowType.MILESTONE;
        rec.depositor   = msg.sender;
        rec.beneficiary = beneficiary;
        rec.trustTier   = trustTier;
        rec.aiArbiter   = useAIArbiter;
        rec.referrer    = referrer;
        rec.createdAt   = block.timestamp;
        rec.token       = token;

        {
            address ra = useAIArbiter ? aiArbiterAddress : arbiter;
            require(ra != address(0), "Arbiter not set");
            rec.arbiter = ra;

            uint256 netTotal;
            for (uint256 i; i < amounts.length; i++) netTotal += amounts[i];
            require(netTotal > 0, "No amounts");
            rec.totalAmount = netTotal;

            if (token == address(0)) {
                // Native ETH path
                (uint256 net, uint256 fee) = _computeFee(msg.value, useAIArbiter);
                require(net >= netTotal, "msg.value too low for amounts + fees");
                accumulatedFees += fee + (net - netTotal);
                uint256 kickback = _recordReferralKickback(referrer, msg.value, fee + (net - netTotal), address(0));
                rec.fee = fee;

                MilestoneEscrow esc = new MilestoneEscrow(address(this), msg.sender, beneficiary, ra, address(0), descriptions, amounts);
                rec.contractAddress = address(esc);
                // Register BEFORE the payable fund() — see createSimpleEscrow
                // for the read-only reentrancy rationale.
                _registerEscrow(rec);
                esc.fund{ value: netTotal }(netTotal);
                if (kickback > 0) emit ReferralCredited(referrer, rec.contractAddress, kickback);
            } else {
                // ERC-20 path
                uint256 gross = IERC20(token).allowance(msg.sender, address(this));
                require(gross > 0, "No token allowance");
                // Compute fee BEFORE any external call (CEI pattern)
                uint256 fee = (gross * protocolFeeBps) / 10_000;
                if (useAIArbiter) fee += aiArbiterFee;
                require(gross > fee, "Amount too low to cover fees");
                require(gross - fee >= netTotal, "Insufficient amount for milestones");
                // Update state BEFORE external call. Per-token accounting
                // (token-denominated fee + leftover, kept separate from ETH).
                accumulatedTokenFees[token] += fee + (gross - fee - netTotal);
                uint256 kickback = _recordReferralKickback(referrer, gross, fee + (gross - fee - netTotal), token);
                rec.fee = fee;

                // Deploy the child first so we have its address.
                MilestoneEscrow esc = new MilestoneEscrow(address(this), msg.sender, beneficiary, ra, token, descriptions, amounts);
                rec.contractAddress = address(esc);
                // Register BEFORE the token transfers — closes the read-only
                // reentrancy window for ERC-777 / callback tokens. See
                // createSimpleEscrow for the full rationale.
                _registerEscrow(rec);
                IERC20(token).safeTransferFrom(msg.sender, address(this), gross);
                IERC20(token).safeTransfer(address(esc), netTotal);
                esc.fund(netTotal);
                if (kickback > 0) emit ReferralCredited(referrer, rec.contractAddress, kickback);
            }
        }

        emit MilestoneEscrowCreated(rec.contractAddress, msg.sender, beneficiary, rec.arbiter, rec.totalAmount, rec.fee, trustTier, useAIArbiter, token);
        return rec.contractAddress;
    }

    // ─── Quote helpers ────────────────────────────────────────────────────────

    function quoteSimple(uint256 escrowAmount, bool _useAIArbiter)
        external view returns (uint256 total, uint256 fee)
    {
        uint256 arbiterFee  = _useAIArbiter ? aiArbiterFee : 0;
        uint256 gross       = (escrowAmount * 10_000 + (10_000 - protocolFeeBps - 1)) / (10_000 - protocolFeeBps);
        uint256 protocolFee = gross - escrowAmount;
        fee   = protocolFee + arbiterFee;
        total = escrowAmount + fee;
    }

    function quoteMilestone(uint256 netTotal, bool _useAIArbiter)
        external view returns (uint256 total, uint256 fee)
    {
        uint256 arbiterFee  = _useAIArbiter ? aiArbiterFee : 0;
        uint256 gross       = (netTotal * 10_000 + (10_000 - protocolFeeBps - 1)) / (10_000 - protocolFeeBps);
        uint256 protocolFee = gross - netTotal;
        fee   = protocolFee + arbiterFee;
        total = netTotal + fee;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function escrowCount() external view returns (uint256) { return escrows.length; }

    function getEscrowsByDepositor(address depositor)
        external view returns (uint256[] memory)
    { return escrowsByDepositor[depositor]; }

    function getEscrowsByBeneficiary(address beneficiary)
        external view returns (uint256[] memory)
    { return escrowsByBeneficiary[beneficiary]; }

    function getEscrows(uint256 offset, uint256 limit)
        external view returns (EscrowRecord[] memory)
    {
        uint256 total = escrows.length;
        if (offset >= total) return new EscrowRecord[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        EscrowRecord[] memory page = new EscrowRecord[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = escrows[i];
        }
        return page;
    }
}
