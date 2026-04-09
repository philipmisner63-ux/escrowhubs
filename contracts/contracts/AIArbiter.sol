// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ISimpleEscrow {
    function resolveRelease() external;
    function resolveRefund()  external;
}

interface IMilestoneEscrow {
    function resolveRelease(uint256 index) external;
    function resolveRefund(uint256 index)  external;
    function milestoneCount()              external view returns (uint256);
}

/**
 * @title AIArbiter
 * @notice On-chain arbiter contract driven by an off-chain AI oracle.
 *         Deploy this contract and use its address as the `arbiter` parameter
 *         in SimpleEscrow or MilestoneEscrow. When a dispute is raised, both
 *         parties submit evidence (IPFS URIs or short text). The AI oracle
 *         service reads the evidence log, makes a decision, and calls back
 *         via resolveRelease / resolveRefund to execute the resolution.
 *
 * @dev Evidence is stored on-chain per escrow address. Resolution is gated
 *      behind an authorized oracleSigner address managed by the owner.
 */
contract AIArbiter is ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Evidence {
        address submitter;
        string  uri;
        uint256 submittedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public oracleSigner;

    /// escrow address → evidence submissions
    mapping(address => Evidence[]) private _evidenceLog;

    // ─── Events ───────────────────────────────────────────────────────────────

    event EvidenceSubmitted(
        address indexed escrow,
        address indexed submitter,
        string          evidenceURI
    );

    event DisputeResolved(
        address indexed escrow,
        string          resolution   // "release" | "refund"
    );

    event OracleSignerUpdated(address indexed newSigner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracleSigner, "Not oracle");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @param _oracleSigner  Address of the off-chain AI oracle service wallet.
     */
    constructor(address _oracleSigner) {
        require(_oracleSigner != address(0), "Invalid oracle signer");
        owner        = msg.sender;
        oracleSigner = _oracleSigner;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Update the authorized oracle signer address.
     * @param newSigner  New oracle wallet address.
     */
    function setOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid oracle signer");
        oracleSigner = newSigner;
        emit OracleSignerUpdated(newSigner);
    }

    /**
     * @notice Transfer contract ownership.
     * @param newOwner  New owner address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ─── Evidence ─────────────────────────────────────────────────────────────

    /**
     * @notice Submit evidence for an active dispute.
     * @param escrowAddress  Address of the disputed escrow contract.
     * @param evidenceURI    IPFS URI (ipfs://...) or short plaintext description.
     */
    function submitEvidence(address escrowAddress, string calldata evidenceURI)
        external
    {
        require(escrowAddress != address(0), "Invalid escrow");
        require(bytes(evidenceURI).length > 0, "Empty evidence");

        _evidenceLog[escrowAddress].push(Evidence({
            submitter:   msg.sender,
            uri:         evidenceURI,
            submittedAt: block.timestamp
        }));

        emit EvidenceSubmitted(escrowAddress, msg.sender, evidenceURI);
    }

    // ─── Resolution: SimpleEscrow ─────────────────────────────────────────────

    /**
     * @notice AI oracle: release funds to beneficiary on a SimpleEscrow.
     * @param escrowAddress  Address of the SimpleEscrow contract.
     */
    function resolveRelease(address escrowAddress)
        external
        onlyOracle
        nonReentrant
    {
        emit DisputeResolved(escrowAddress, "release");
        ISimpleEscrow(escrowAddress).resolveRelease();
    }

    /**
     * @notice AI oracle: refund depositor on a SimpleEscrow.
     * @param escrowAddress  Address of the SimpleEscrow contract.
     */
    function resolveRefund(address escrowAddress)
        external
        onlyOracle
        nonReentrant
    {
        emit DisputeResolved(escrowAddress, "refund");
        ISimpleEscrow(escrowAddress).resolveRefund();
    }

    // ─── Resolution: MilestoneEscrow ──────────────────────────────────────────

    /**
     * @notice AI oracle: release a specific milestone to beneficiary.
     * @param escrowAddress  Address of the MilestoneEscrow contract.
     * @param milestoneIndex Index of the disputed milestone.
     */
    function resolveMilestoneRelease(address escrowAddress, uint256 milestoneIndex)
        external
        onlyOracle
        nonReentrant
    {
        emit DisputeResolved(escrowAddress, "release");
        IMilestoneEscrow(escrowAddress).resolveRelease(milestoneIndex);
    }

    /**
     * @notice AI oracle: refund a specific milestone to depositor.
     * @param escrowAddress  Address of the MilestoneEscrow contract.
     * @param milestoneIndex Index of the disputed milestone.
     */
    function resolveMilestoneRefund(address escrowAddress, uint256 milestoneIndex)
        external
        onlyOracle
        nonReentrant
    {
        emit DisputeResolved(escrowAddress, "refund");
        IMilestoneEscrow(escrowAddress).resolveRefund(milestoneIndex);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Get the number of evidence submissions for an escrow.
     * @param escrowAddress  Address of the escrow contract.
     */
    function getEvidenceCount(address escrowAddress)
        external view returns (uint256)
    {
        return _evidenceLog[escrowAddress].length;
    }

    /**
     * @notice Get a specific evidence submission.
     * @param escrowAddress  Address of the escrow contract.
     * @param index          Index in the evidence array.
     */
    function getEvidence(address escrowAddress, uint256 index)
        external view returns (Evidence memory)
    {
        require(index < _evidenceLog[escrowAddress].length, "Index out of bounds");
        return _evidenceLog[escrowAddress][index];
    }

    /**
     * @notice Get all evidence for an escrow (use with care on large arrays).
     * @param escrowAddress  Address of the escrow contract.
     */
    function getAllEvidence(address escrowAddress)
        external view returns (Evidence[] memory)
    {
        return _evidenceLog[escrowAddress];
    }
}
