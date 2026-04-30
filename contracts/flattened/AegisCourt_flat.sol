// Sources flattened with hardhat v2.28.6 https://hardhat.org

// SPDX-License-Identifier: MIT

// File AegisCourt.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

contract AegisCourt {
    enum Verdict {
        PENDING,
        CLEARED,
        FLAGGED
    }

    struct Dispute {
        bytes32 rootHash;
        string agentId;
        address disputedBy;
        string reason;
        uint256 timestamp;
        Verdict verdict;
        bytes teeProof;
        bool exists;
    }

    address public owner;
    address public verifier;

    mapping(bytes32 => Dispute) private disputes;
    bytes32[] private disputeKeys;

    event DisputeFiled(bytes32 indexed rootHash, string agentId, address indexed disputedBy);
    event VerdictEmitted(bytes32 indexed rootHash, string agentId, Verdict verdict, bytes teeProof);

    error Unauthorized();
    error DisputeNotFound();
    error DisputeAlreadyExists();
    error VerdictAlreadyRecorded();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert Unauthorized();
        _;
    }

    constructor(address _verifier) {
        owner = msg.sender;
        verifier = _verifier;
    }

    function setVerifier(address _verifier) external onlyOwner {
        verifier = _verifier;
    }

    function submitDispute(
        bytes32 rootHash,
        string calldata agentId,
        string calldata reason
    ) external {
        if (disputes[rootHash].exists) revert DisputeAlreadyExists();

        disputes[rootHash] = Dispute({
            rootHash: rootHash,
            agentId: agentId,
            disputedBy: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            verdict: Verdict.PENDING,
            teeProof: bytes(""),
            exists: true
        });

        disputeKeys.push(rootHash);

        emit DisputeFiled(rootHash, agentId, msg.sender);
    }

    function recordVerdict(
        bytes32 rootHash,
        Verdict verdict,
        bytes calldata teeProof
    ) external onlyVerifier {
        Dispute storage dispute = disputes[rootHash];
        if (!dispute.exists) revert DisputeNotFound();
        if (dispute.verdict != Verdict.PENDING) revert VerdictAlreadyRecorded();

        dispute.verdict = verdict;
        dispute.teeProof = teeProof;

        emit VerdictEmitted(rootHash, dispute.agentId, verdict, teeProof);
    }

    function getDispute(bytes32 rootHash) external view returns (Dispute memory) {
        if (!disputes[rootHash].exists) revert DisputeNotFound();
        return disputes[rootHash];
    }

    function getDisputeCount() external view returns (uint256) {
        return disputeKeys.length;
    }
}
