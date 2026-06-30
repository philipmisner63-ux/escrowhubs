// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

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
 *
 *      v0.11.0 security upgrades (Fusion audit 2026-06-16):
 *      - Escrow registry: escrows must be registered by the trusted factory
 *        before they can be resolved. Closes the confused-deputy risk where
 *        any contract that trusts AIArbiter + has matching selectors was
 *        reachable through the arbiter.
 *      - Code-length check on resolve calls: rejects calls to EOAs or
 *        non-existent contracts.
 *      - Milestone index bounds check: validates the index against
 *        milestoneCount() before calling resolve.
 *      - 2-step ownership: prevents permanent bricking on a typo'd newOwner.
 *      - transferOwnership emits event AFTER validation (fixes CEI smell).
 */
contract AIArbiter is Ownable2Step, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum EscrowType { NONE, SIMPLE, MILESTONE }

    struct Evidence {
        address submitter;
        string  uri;
        uint256 submittedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice The off-chain AI oracle service wallet.
    address public oracleSigner;

    /// @notice The trusted factory that may register escrows with this arbiter.
    ///         Only the factory can populate the registry; only registered
    ///         escrows can be resolved. Set by owner at deployment.
    address public trustedFactory;

    /// @notice escrow address → type. Populated by the trusted factory.
    ///         Escrows with type NONE (or absent) cannot be resolved.
    mapping(address => EscrowType) public escrowType;

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
    event TrustedFactoryUpdated(address indexed newFactory);
    event EscrowRegistered(address indexed escrow, EscrowType typ);
    event EscrowUnregistered(address indexed escrow);
    // OwnershipTransferred is inherited from Ownable — do not redeclare.

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOracle() {
        require(msg.sender == oracleSigner, "Not oracle");
        _;
    }

    modifier onlyFactory_() {
        require(msg.sender == trustedFactory, "Not factory");
        _;
    }

    /**
     * @param _oracleSigner   The off-chain AI oracle service wallet.
     * @param _initialOwner   The admin address (multisig recommended).
     * @param _trustedFactory The factory contract authorized to register
     *                        escrows with this arbiter. Set to address(0)
     *                        initially; the owner must set it before any
     *                        escrows can be registered/resolved.
     */
    constructor(
        address _oracleSigner,
        address _initialOwner,
        address _trustedFactory
    ) Ownable(_initialOwner) {
        require(_oracleSigner != address(0), "Invalid oracle signer");
        require(_initialOwner != address(0), "Invalid initial owner");
        oracleSigner   = _oracleSigner;
        trustedFactory = _trustedFactory;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid oracle signer");
        oracleSigner = newSigner;
        emit OracleSignerUpdated(newSigner);
    }

    /// @notice Set the trusted factory that can register escrows.
    ///         Required before any escrow can be resolved.
    function setTrustedFactory(address newFactory) external onlyOwner {
        require(newFactory != address(0), "Invalid factory");
        trustedFactory = newFactory;
        emit TrustedFactoryUpdated(newFactory);
    }

    // ─── Registry ────────────────────────────────────────────────────────────

    /// @notice Register an escrow with this arbiter. Only the trusted
    ///         factory may call. Required before any resolve call on the
    ///         escrow can succeed.
    function registerEscrow(address escrowAddress, EscrowType typ)
        external
        onlyFactory_
    {
        require(escrowAddress != address(0), "Invalid escrow");
        require(escrowAddress.code.length > 0, "Escrow not a contract");
        require(typ != EscrowType.NONE, "Cannot register as NONE");
        require(escrowType[escrowAddress] == EscrowType.NONE, "Already registered");
        escrowType[escrowAddress] = typ;
        emit EscrowRegistered(escrowAddress, typ);
    }

    /// @notice Unregister an escrow (e.g. when fully resolved and the
    ///         factory wants to reclaim storage or signal end-of-life).
    ///         Only the factory may call.
    function unregisterEscrow(address escrowAddress) external onlyFactory_ {
        require(escrowType[escrowAddress] != EscrowType.NONE, "Not registered");
        escrowType[escrowAddress] = EscrowType.NONE;
        emit EscrowUnregistered(escrowAddress);
    }

    // ─── Evidence ─────────────────────────────────────────────────────────────

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

    function resolveRelease(address escrowAddress)
        external
        onlyOracle
        nonReentrant
    {
        _requireSimpleRegistered(escrowAddress);
        emit DisputeResolved(escrowAddress, "release");
        ISimpleEscrow(escrowAddress).resolveRelease();
    }

    function resolveRefund(address escrowAddress)
        external
        onlyOracle
        nonReentrant
    {
        _requireSimpleRegistered(escrowAddress);
        emit DisputeResolved(escrowAddress, "refund");
        ISimpleEscrow(escrowAddress).resolveRefund();
    }

    // ─── Resolution: MilestoneEscrow ──────────────────────────────────────────

    function resolveMilestoneRelease(address escrowAddress, uint256 milestoneIndex)
        external
        onlyOracle
        nonReentrant
    {
        _requireMilestoneRegistered(escrowAddress);
        require(milestoneIndex < IMilestoneEscrow(escrowAddress).milestoneCount(), "Index out of bounds");
        emit DisputeResolved(escrowAddress, "release");
        IMilestoneEscrow(escrowAddress).resolveRelease(milestoneIndex);
    }

    function resolveMilestoneRefund(address escrowAddress, uint256 milestoneIndex)
        external
        onlyOracle
        nonReentrant
    {
        _requireMilestoneRegistered(escrowAddress);
        require(milestoneIndex < IMilestoneEscrow(escrowAddress).milestoneCount(), "Index out of bounds");
        emit DisputeResolved(escrowAddress, "refund");
        IMilestoneEscrow(escrowAddress).resolveRefund(milestoneIndex);
    }

    // ─── Internal validation ─────────────────────────────────────────────────

    function _requireSimpleRegistered(address escrowAddress) internal view {
        require(escrowAddress != address(0), "Invalid escrow");
        require(escrowAddress.code.length > 0, "Escrow not a contract");
        require(escrowType[escrowAddress] == EscrowType.SIMPLE, "Not a registered simple escrow");
    }

    function _requireMilestoneRegistered(address escrowAddress) internal view {
        require(escrowAddress != address(0), "Invalid escrow");
        require(escrowAddress.code.length > 0, "Escrow not a contract");
        require(escrowType[escrowAddress] == EscrowType.MILESTONE, "Not a registered milestone escrow");
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getEvidenceCount(address escrowAddress)
        external view returns (uint256)
    {
        return _evidenceLog[escrowAddress].length;
    }

    function getEvidence(address escrowAddress, uint256 index)
        external view returns (Evidence memory)
    {
        require(index < _evidenceLog[escrowAddress].length, "Index out of bounds");
        return _evidenceLog[escrowAddress][index];
    }

    function getAllEvidence(address escrowAddress)
        external view returns (Evidence[] memory)
    {
        return _evidenceLog[escrowAddress];
    }
}
