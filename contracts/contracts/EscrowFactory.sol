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

    /// Accumulated fees available for withdrawal (net of referral kickbacks)
    uint256 public accumulatedFees;

    // ─── Referrals ────────────────────────────────────────────────────────────

    /// Referral share: percentage of protocol fee paid to referrer (basis points).
    /// Default 2000 = 20% of protocol fee. Max 5000 (50%).
    uint16 public referralShareBps = 2000;

    /// Accumulated referral earnings per wallet (claimable via pull pattern)
    mapping(address => uint256) public referralEarnings;

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
    event ReferralShareUpdated(uint16 newShareBps);
    event AIArbiterUpdated(address indexed newAIArbiter);
    event FeesUpdated(uint16 protocolFeeBps, uint256 aiArbiterFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Admin: Fees ──────────────────────────────────────────────────────────

    function setFees(uint16 _protocolFeeBps, uint256 _aiArbiterFee) external onlyOwner {
        require(_protocolFeeBps <= 500, "Fee too high");
        protocolFeeBps = _protocolFeeBps;
        aiArbiterFee   = _aiArbiterFee;
        emit FeesUpdated(_protocolFeeBps, _aiArbiterFee);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "Nothing to withdraw");
        accumulatedFees = 0;
        emit FeesWithdrawn(treasury, amount);
        payable(treasury).transfer(amount);
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

    // ─── Referral: claim ──────────────────────────────────────────────────────

    /// @notice Referrers call this to withdraw accumulated BDAG earnings.
    function claimReferralEarnings() external nonReentrant {
        uint256 earned = referralEarnings[msg.sender];
        require(earned > 0, "No earnings");
        referralEarnings[msg.sender] = 0;
        emit ReferralClaimed(msg.sender, earned);
        payable(msg.sender).transfer(earned);
    }

    /// @notice Get referral stats for a wallet.
    function getReferralStats(address wallet)
        external view returns (uint256 count, uint256 earned, uint256 claimable)
    {
        count     = referralCount[wallet];
        earned    = referralTotalEarned[wallet];
        claimable = referralEarnings[wallet];
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

    /// @dev Apply referral kickback. Returns the kickback amount.
    function _applyReferral(address referrer, uint256 grossValue, uint256 fee, address escrow)
        internal returns (uint256 kickback)
    {
        if (referrer == address(0) || referrer == msg.sender) return 0;
        // Combine multiplications before dividing to avoid precision loss
        kickback = (grossValue * protocolFeeBps * referralShareBps) / (10_000 * 10_000);
        if (kickback == 0 || kickback > fee) return 0;
        accumulatedFees -= kickback;
        referralEarnings[referrer]    += kickback;
        referralTotalEarned[referrer] += kickback;
        referralCount[referrer]       += 1;
        emit ReferralCredited(referrer, escrow, kickback);
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
                rec.totalAmount = net;
                rec.fee = fee;

                SimpleEscrow esc = new SimpleEscrow(msg.sender, beneficiary, ra, address(0));
                esc.deposit{ value: net }(net);
                rec.contractAddress = address(esc);
                _applyReferral(referrer, msg.value, fee, rec.contractAddress);
            } else {
                // ERC-20 path: fee charged in tokens
                uint256 gross = IERC20(token).allowance(msg.sender, address(this));
                require(gross > 0, "No token allowance");
                // Pull full approved amount; compute fee
                IERC20(token).safeTransferFrom(msg.sender, address(this), gross);
                uint256 fee = (gross * protocolFeeBps) / 10_000;
                if (useAIArbiter) fee += aiArbiterFee;
                require(gross > fee, "Amount too low to cover fees");
                uint256 net = gross - fee;
                accumulatedFees += fee; // tracked as token units in accumulatedTokenFees ideally, but kept simple
                rec.totalAmount = net;
                rec.fee = fee;

                SimpleEscrow esc = new SimpleEscrow(msg.sender, beneficiary, ra, token);
                IERC20(token).safeTransfer(address(esc), net);
                esc.deposit(net);
                rec.contractAddress = address(esc);
                _applyReferral(referrer, gross, fee, rec.contractAddress);
            }
        }

        _registerEscrow(rec);
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
                rec.fee = fee;

                MilestoneEscrow esc = new MilestoneEscrow(msg.sender, beneficiary, ra, address(0), descriptions, amounts);
                esc.fund{ value: netTotal }(netTotal);
                rec.contractAddress = address(esc);
                _applyReferral(referrer, msg.value, fee + (net - netTotal), rec.contractAddress);
            } else {
                // ERC-20 path
                uint256 gross = IERC20(token).allowance(msg.sender, address(this));
                require(gross > 0, "No token allowance");
                IERC20(token).safeTransferFrom(msg.sender, address(this), gross);
                uint256 fee = (gross * protocolFeeBps) / 10_000;
                if (useAIArbiter) fee += aiArbiterFee;
                require(gross > fee, "Amount too low to cover fees");
                require(gross - fee >= netTotal, "Insufficient amount for milestones");
                accumulatedFees += fee + (gross - fee - netTotal);
                rec.fee = fee;

                MilestoneEscrow esc = new MilestoneEscrow(msg.sender, beneficiary, ra, token, descriptions, amounts);
                IERC20(token).safeTransfer(address(esc), netTotal);
                esc.fund(netTotal);
                rec.contractAddress = address(esc);
                _applyReferral(referrer, gross, fee + (gross - fee - netTotal), rec.contractAddress);
            }
        }

        _registerEscrow(rec);
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
