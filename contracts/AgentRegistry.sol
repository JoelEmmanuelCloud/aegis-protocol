// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is ERC721, Ownable {
    struct AccountabilitySplit {
        uint8 userPercent;
        uint8 builderPercent;
    }

    struct AgentRecord {
        string ensName;
        bytes32 ensNode;
        string storageRoot;
        address builderAddress;
        AccountabilitySplit split;
        bool active;
        uint256 mintedAt;
    }

    uint256 private _nextTokenId;

    mapping(uint256 => AgentRecord) private _agents;
    mapping(string => uint256) private _ensNameToTokenId;
    mapping(address => uint256[]) private _ownerTokenIds;

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string ensName,
        bytes32 ensNode,
        uint8 userPercent,
        uint8 builderPercent
    );

    event StorageRootUpdated(uint256 indexed tokenId, string storageRoot);
    event ReputationUpdated(uint256 indexed tokenId);
    event AgentSuspended(uint256 indexed tokenId);
    event AgentReactivated(uint256 indexed tokenId);

    error InvalidSplit();
    error EnsNameTaken();
    error TokenNotFound();

    constructor() ERC721("Aegis iNFT", "AINFT") Ownable(msg.sender) {}

    function mint(
        address agentOwner,
        address builderAddress,
        string calldata label,
        uint8 userPercent,
        uint8 builderPercent
    ) external onlyOwner returns (uint256 tokenId) {
        if (userPercent + builderPercent != 100) revert InvalidSplit();
        if (_ensNameToTokenId[label] != 0) revert EnsNameTaken();

        tokenId = ++_nextTokenId;

        _safeMint(agentOwner, tokenId);

        string memory ensName = string(abi.encodePacked(label, ".aegis.eth"));
        bytes32 ensNode = keccak256(abi.encodePacked(label));

        _agents[tokenId] = AgentRecord({
            ensName: ensName,
            ensNode: ensNode,
            storageRoot: "",
            builderAddress: builderAddress,
            split: AccountabilitySplit(userPercent, builderPercent),
            active: true,
            mintedAt: block.timestamp
        });

        _ensNameToTokenId[label] = tokenId;
        _ownerTokenIds[agentOwner].push(tokenId);

        emit AgentMinted(tokenId, agentOwner, ensName, ensNode, userPercent, builderPercent);
    }

    function updateStorageRoot(uint256 tokenId, string calldata storageRoot) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        _agents[tokenId].storageRoot = storageRoot;
        emit StorageRootUpdated(tokenId, storageRoot);
    }

    function updateReputation(
        uint256 tokenId,
        string calldata,
        string calldata,
        string calldata,
        string calldata
    ) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        emit ReputationUpdated(tokenId);
    }

    function suspendAgent(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        _agents[tokenId].active = false;
        emit AgentSuspended(tokenId);
    }

    function reactivateAgent(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        _agents[tokenId].active = true;
        emit AgentReactivated(tokenId);
    }

    function getAgent(uint256 tokenId) external view returns (AgentRecord memory) {
        if (!_exists(tokenId)) revert TokenNotFound();
        return _agents[tokenId];
    }

    function getTokenByEnsLabel(string calldata label) external view returns (uint256) {
        return _ensNameToTokenId[label];
    }

    function getOwnerTokenIds(address agentOwner) external view returns (uint256[] memory) {
        return _ownerTokenIds[agentOwner];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _nextTokenId;
    }
}
