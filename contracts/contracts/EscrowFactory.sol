// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SimpleEscrow.sol";
import "./MilestoneEscrow.sol";

/**
 * @title EscrowFactory
 * @notice Deploys and indexes all SimpleEscrow and MilestoneEscrow contracts.
 *         The factory is the single source of truth for escrow discovery —
 *         the frontend queries it instead of requiring users to paste addresses.
 *
 * @dev Monetisation:
 *      - Protocol fee: taken from msg.value at deploy time (basis points, default 50 = 0.5%)
 *      - AI Arbiter fee: flat fee charged when useAIArbiter=true (default 1 BDAG)
 *      Both fees accumulate in this contract and are withdrawn by the owner.
 *
 *      Trust score is computed off-chain and passed in at deploy time.
 *      AI Arbiter: set aiArbiterAddress via setAIArbiter() after deploying AIArbiter.sol.
 */
contract EscrowFactory {

    // ─── Admin ────────────────────────────────────────────────────────────────

    address public owner;
    address public treasury;  // receives fee withdrawals (defaults to owner)

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    // ─── Fees ─────────────────────────────────────────────────────────────────

    /// Protocol fee in basis points (50 = 0.5%, 100 = 1%). Max 500 (5%).
    uint16  public protocolFeeBps  = 50;

    /// Flat fee charged when AI Arbiter is selected (in wei). Default 1 BDAG.
    uint256 public aiArbiterFee    = 1 ether;

    /// Accumulated fees available for withdrawal
    uint256 public accumulatedFees;

    // ─── AI Arbiter ───────────────────────────────────────────────────────────

    /// Address of the deployed AIArbiter contract
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
        uint256     totalAmount;   // net amount (after fee)
        uint256     fee;           // protocol fee taken
        uint8       trustTier;     // 0=Standard, 1=Enhanced, 2=Full
        bool        aiArbiter;     // true if AI Arbiter was used
        uint256     createdAt;
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
        bool            aiArbiter
    );

    event MilestoneEscrowCreated(
        address indexed contractAddress,
        address indexed depositor,
        address indexed beneficiary,
        address         arbiter,
        uint256         totalAmount,
        uint256         fee,
        uint8           trustTier,
        bool            aiArbiter
    );

    event AIArbiterUpdated(address indexed newAIArbiter);
    event FeesUpdated(uint16 protocolFeeBps, uint256 aiArbiterFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Admin: Fees ──────────────────────────────────────────────────────────

    /**
     * @notice Update fee parameters.
     * @param _protocolFeeBps  Protocol fee in basis points (max 500 = 5%).
     * @param _aiArbiterFee    Flat fee for AI Arbiter in wei.
     */
    function setFees(uint16 _protocolFeeBps, uint256 _aiArbiterFee) external onlyOwner {
        require(_protocolFeeBps <= 500, "Fee too high");
        protocolFeeBps = _protocolFeeBps;
        aiArbiterFee   = _aiArbiterFee;
        emit FeesUpdated(_protocolFeeBps, _aiArbiterFee);
    }

    /**
     * @notice Withdraw accumulated fees to treasury.
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "Nothing to withdraw");
        accumulatedFees = 0;
        emit FeesWithdrawn(treasury, amount);
        payable(treasury).transfer(amount);
    }

    /**
     * @notice Update the treasury address.
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // ─── Admin: AI Arbiter ────────────────────────────────────────────────────

    /**
     * @notice Set the deployed AIArbiter contract address.
     */
    function setAIArbiter(address _aiArbiter) external onlyOwner {
        require(_aiArbiter != address(0), "Invalid AIArbiter address");
        aiArbiterAddress = _aiArbiter;
        emit AIArbiterUpdated(_aiArbiter);
    }

    /**
     * @notice Transfer ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ─── Internal: fee calculation ────────────────────────────────────────────

    /**
     * @dev Computes protocol fee + optional AI arbiter fee from msg.value.
     *      Returns (netAmount, totalFee).
     *      netAmount = the value forwarded to the escrow contract.
     */
    function _computeFee(uint256 value, bool _useAIArbiter)
        internal view returns (uint256 netAmount, uint256 totalFee)
    {
        uint256 protocolFee = (value * protocolFeeBps) / 10_000;
        uint256 arbiterFee  = _useAIArbiter ? aiArbiterFee : 0;
        totalFee  = protocolFee + arbiterFee;
        require(value > totalFee, "Amount too low to cover fees");
        netAmount = value - totalFee;
    }

    // ─── Deploy: SimpleEscrow ─────────────────────────────────────────────────

    /**
     * @notice Deploy a SimpleEscrow and register it.
     * @param beneficiary   The party who receives funds on release.
     * @param arbiter       Arbiter address (ignored if useAIArbiter=true).
     * @param trustTier     0=Standard, 1=Enhanced, 2=Full (computed off-chain).
     * @param useAIArbiter  If true, use the AI Arbiter contract (extra fee applies).
     */
    function createSimpleEscrow(
        address beneficiary,
        address arbiter,
        uint8   trustTier,
        bool    useAIArbiter
    ) external payable returns (address) {
        require(trustTier <= 2, "Invalid trust tier");
        require(msg.value > 0, "Must send BDAG");

        address resolvedArbiter = useAIArbiter ? aiArbiterAddress : arbiter;
        require(resolvedArbiter != address(0), "Arbiter not set");

        (uint256 netAmount, uint256 fee) = _computeFee(msg.value, useAIArbiter);
        accumulatedFees += fee;

        SimpleEscrow escrow = new SimpleEscrow(beneficiary, resolvedArbiter);
        escrow.deposit{ value: netAmount }();

        uint256 index = escrows.length;
        escrows.push(EscrowRecord({
            contractAddress: address(escrow),
            escrowType:      EscrowType.SIMPLE,
            depositor:       msg.sender,
            beneficiary:     beneficiary,
            arbiter:         resolvedArbiter,
            totalAmount:     netAmount,
            fee:             fee,
            trustTier:       trustTier,
            aiArbiter:       useAIArbiter,
            createdAt:       block.timestamp
        }));

        escrowsByDepositor[msg.sender].push(index);
        escrowsByBeneficiary[beneficiary].push(index);
        escrowIndex[address(escrow)] = index + 1;

        emit SimpleEscrowCreated(
            address(escrow),
            msg.sender,
            beneficiary,
            resolvedArbiter,
            netAmount,
            fee,
            trustTier,
            useAIArbiter
        );

        return address(escrow);
    }

    // ─── Deploy: MilestoneEscrow ──────────────────────────────────────────────

    /**
     * @notice Deploy a MilestoneEscrow and register it.
     * @param beneficiary   The party who receives milestone payments.
     * @param arbiter       Arbiter address (ignored if useAIArbiter=true).
     * @param descriptions  Human-readable description per milestone.
     * @param amounts       BDAG amount per milestone (net, after fee).
     * @param trustTier     0=Standard, 1=Enhanced, 2=Full (computed off-chain).
     * @param useAIArbiter  If true, use the AI Arbiter contract (extra fee applies).
     *
     * @dev msg.value must equal sum(amounts) + protocol fee + optional AI arbiter fee.
     *      The frontend should compute this with quoteSimple / quoteMilestone view functions.
     */
    function createMilestoneEscrow(
        address          beneficiary,
        address          arbiter,
        string[] memory  descriptions,
        uint256[] memory amounts,
        uint8            trustTier,
        bool             useAIArbiter
    ) external payable returns (address) {
        require(trustTier <= 2, "Invalid trust tier");

        address resolvedArbiter = useAIArbiter ? aiArbiterAddress : arbiter;
        require(resolvedArbiter != address(0), "Arbiter not set");

        uint256 netTotal;
        for (uint256 i; i < amounts.length; i++) netTotal += amounts[i];
        require(netTotal > 0, "No amounts");

        // Fee is computed on the gross (msg.value), net amounts go to escrow
        (uint256 netAmount, uint256 fee) = _computeFee(msg.value, useAIArbiter);
        require(netAmount >= netTotal, "msg.value too low for amounts + fees");
        // Any 1-wei rounding dust goes to accumulated fees
        uint256 dust = netAmount - netTotal;
        accumulatedFees += fee + dust;

        MilestoneEscrow escrow = new MilestoneEscrow(
            beneficiary,
            resolvedArbiter,
            descriptions,
            amounts
        );
        escrow.fund{ value: netTotal }();

        uint256 index = escrows.length;
        escrows.push(EscrowRecord({
            contractAddress: address(escrow),
            escrowType:      EscrowType.MILESTONE,
            depositor:       msg.sender,
            beneficiary:     beneficiary,
            arbiter:         resolvedArbiter,
            totalAmount:     netTotal,
            fee:             fee,
            trustTier:       trustTier,
            aiArbiter:       useAIArbiter,
            createdAt:       block.timestamp
        }));

        escrowsByDepositor[msg.sender].push(index);
        escrowsByBeneficiary[beneficiary].push(index);
        escrowIndex[address(escrow)] = index + 1;

        emit MilestoneEscrowCreated(
            address(escrow),
            msg.sender,
            beneficiary,
            resolvedArbiter,
            netTotal,
            fee,
            trustTier,
            useAIArbiter
        );

        return address(escrow);
    }

    // ─── Quote helpers (frontend use) ────────────────────────────────────────

    /**
     * @notice Calculate total msg.value required to create a SimpleEscrow.
     * @param escrowAmount  The net BDAG amount to lock in escrow.
     * @param _useAIArbiter Whether AI Arbiter is selected.
     * @return total        The gross amount to send (escrowAmount + fees).
     * @return fee          The fee component.
     */
    function quoteSimple(uint256 escrowAmount, bool _useAIArbiter)
        external view returns (uint256 total, uint256 fee)
    {
        uint256 arbiterFee   = _useAIArbiter ? aiArbiterFee : 0;
        // gross = net / (1 - feeBps/10000) — rounded up
        uint256 gross        = (escrowAmount * 10_000 + (10_000 - protocolFeeBps - 1)) / (10_000 - protocolFeeBps);
        uint256 protocolFee  = gross - escrowAmount;
        fee   = protocolFee + arbiterFee;
        total = escrowAmount + fee;
    }

    /**
     * @notice Calculate total msg.value required to create a MilestoneEscrow.
     * @param netTotal      Sum of all milestone amounts.
     * @param _useAIArbiter Whether AI Arbiter is selected.
     * @return total        The gross amount to send.
     * @return fee          The fee component.
     */
    function quoteMilestone(uint256 netTotal, bool _useAIArbiter)
        external view returns (uint256 total, uint256 fee)
    {
        uint256 arbiterFee   = _useAIArbiter ? aiArbiterFee : 0;
        uint256 gross        = (netTotal * 10_000 + (10_000 - protocolFeeBps - 1)) / (10_000 - protocolFeeBps);
        uint256 protocolFee  = gross - netTotal;
        fee   = protocolFee + arbiterFee;
        total = netTotal + fee;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function escrowCount() external view returns (uint256) {
        return escrows.length;
    }

    function getEscrowsByDepositor(address depositor)
        external view returns (uint256[] memory)
    {
        return escrowsByDepositor[depositor];
    }

    function getEscrowsByBeneficiary(address beneficiary)
        external view returns (uint256[] memory)
    {
        return escrowsByBeneficiary[beneficiary];
    }

    /**
     * @notice Paginated fetch — avoids gas limits on large arrays.
     */
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
