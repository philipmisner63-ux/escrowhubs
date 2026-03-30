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
 * @dev Trust score is computed off-chain and passed in at deploy time.
 *      On-chain it is recorded but not enforced — enforcement is the frontend's job.
 *      This keeps the contract simple and gas-efficient.
 *
 *      AI Arbiter: set aiArbiterAddress via setAIArbiter() after deploying AIArbiter.sol.
 *      Pass useAIArbiter=true on create functions to auto-route disputes to the AI oracle.
 */
contract EscrowFactory {

    // ─── Admin ────────────────────────────────────────────────────────────────

    address public owner;

    /// Address of the deployed AIArbiter contract (set after deploy)
    address public aiArbiterAddress;

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
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
        uint8       trustTier;   // 0=Standard, 1=Enhanced, 2=Full
        uint256     createdAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    EscrowRecord[] public escrows;

    /// depositor → list of escrow indices
    mapping(address => uint256[]) public escrowsByDepositor;
    /// beneficiary → list of escrow indices
    mapping(address => uint256[]) public escrowsByBeneficiary;
    /// contract address → index + 1 (0 means not found)
    mapping(address => uint256)   public escrowIndex;

    // ─── Events ───────────────────────────────────────────────────────────────

    event SimpleEscrowCreated(
        address indexed contractAddress,
        address indexed depositor,
        address indexed beneficiary,
        address         arbiter,
        uint256         amount,
        uint8           trustTier
    );

    event MilestoneEscrowCreated(
        address indexed contractAddress,
        address indexed depositor,
        address indexed beneficiary,
        address         arbiter,
        uint256         totalAmount,
        uint8           trustTier
    );

    event AIArbiterUpdated(address indexed newAIArbiter);

    // ─── Admin: AI Arbiter ────────────────────────────────────────────────────

    /**
     * @notice Set the deployed AIArbiter contract address.
     * @param _aiArbiter  Address of the AIArbiter contract.
     */
    function setAIArbiter(address _aiArbiter) external onlyOwner {
        require(_aiArbiter != address(0), "Invalid AIArbiter address");
        aiArbiterAddress = _aiArbiter;
        emit AIArbiterUpdated(_aiArbiter);
    }

    // ─── Deploy: SimpleEscrow ─────────────────────────────────────────────────

    /**
     * @notice Deploy a SimpleEscrow and register it.
     * @param beneficiary   The party who receives funds on release.
     * @param arbiter       The neutral third party for dispute resolution.
     * @param trustTier     0=Standard, 1=Enhanced, 2=Full (computed off-chain).
     * @param useAIArbiter  If true, override arbiter with the deployed AIArbiter address.
     */
    function createSimpleEscrow(
        address beneficiary,
        address arbiter,
        uint8   trustTier,
        bool    useAIArbiter
    ) external payable returns (address) {
        require(trustTier <= 2, "Invalid trust tier");

        address resolvedArbiter = useAIArbiter ? aiArbiterAddress : arbiter;
        require(resolvedArbiter != address(0), "Arbiter not set");

        SimpleEscrow escrow = new SimpleEscrow(beneficiary, resolvedArbiter);

        // Forward deposit value if provided
        if (msg.value > 0) {
            escrow.deposit{ value: msg.value }();
        }

        uint256 index = escrows.length;
        escrows.push(EscrowRecord({
            contractAddress: address(escrow),
            escrowType:      EscrowType.SIMPLE,
            depositor:       msg.sender,
            beneficiary:     beneficiary,
            arbiter:         resolvedArbiter,
            totalAmount:     msg.value,
            trustTier:       trustTier,
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
            msg.value,
            trustTier
        );

        return address(escrow);
    }

    // ─── Deploy: MilestoneEscrow ──────────────────────────────────────────────

    /**
     * @notice Deploy a MilestoneEscrow and register it.
     * @param beneficiary   The party who receives milestone payments.
     * @param arbiter       The neutral third party for dispute resolution.
     * @param descriptions  Human-readable description for each milestone.
     * @param amounts       BDAG amount for each milestone (must match msg.value total).
     * @param trustTier     0=Standard, 1=Enhanced, 2=Full (computed off-chain).
     * @param useAIArbiter  If true, override arbiter with the deployed AIArbiter address.
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

        uint256 total;
        for (uint256 i; i < amounts.length; i++) total += amounts[i];

        MilestoneEscrow escrow = new MilestoneEscrow(
            beneficiary,
            resolvedArbiter,
            descriptions,
            amounts
        );

        // Forward funding if exact total provided
        if (msg.value == total && total > 0) {
            escrow.fund{ value: msg.value }();
        }

        uint256 index = escrows.length;
        escrows.push(EscrowRecord({
            contractAddress: address(escrow),
            escrowType:      EscrowType.MILESTONE,
            depositor:       msg.sender,
            beneficiary:     beneficiary,
            arbiter:         resolvedArbiter,
            totalAmount:     total,
            trustTier:       trustTier,
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
            total,
            trustTier
        );

        return address(escrow);
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
     * @param offset  Start index.
     * @param limit   Max records to return.
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
