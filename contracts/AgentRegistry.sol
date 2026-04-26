// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface INameWrapper {
    function setSubnodeRecord(
        bytes32 node,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32);
}

interface IPublicResolver {
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;
}

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

    bytes32 public constant ETH_NODE =
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

    bytes32 public immutable AEGIS_NODE;

    INameWrapper public immutable NAME_WRAPPER;
    IPublicResolver public immutable PUBLIC_RESOLVER;

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
    event AgentSuspended(uint256 indexed tokenId);
    event AgentReactivated(uint256 indexed tokenId);

    error InvalidSplit();
    error EnsNameTaken();
    error TokenNotFound();
    error NotAuthorized();

    constructor(
        address _nameWrapper,
        address _publicResolver
    ) ERC721("Aegis iNFT", "AINFT") Ownable(msg.sender) {
        NAME_WRAPPER = INameWrapper(_nameWrapper);
        PUBLIC_RESOLVER = IPublicResolver(_publicResolver);
        AEGIS_NODE = keccak256(abi.encodePacked(ETH_NODE, keccak256(bytes("aegis"))));
    }

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
        bytes32 subnode = bytes32(0);

        try NAME_WRAPPER.setSubnodeRecord(
            AEGIS_NODE,
            label,
            address(this),
            address(PUBLIC_RESOLVER),
            0,
            0,
            uint64(block.timestamp + 365 days)
        ) returns (bytes32 node) {
            subnode = node;
            try PUBLIC_RESOLVER.setText(subnode, "agent.registry", _toHexString(address(this))) {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "agent.id", _uint256ToHex(tokenId)) {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "aegis.reputation", "100") {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "aegis.totalDecisions", "0") {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "aegis.lastVerdict", "CLEARED") {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "aegis.flaggedCount", "0") {} catch {}
            try PUBLIC_RESOLVER.setText(subnode, "aegis.registry", "aegis.eth") {} catch {}
        } catch {}

        _agents[tokenId] = AgentRecord({
            ensName: ensName,
            ensNode: subnode,
            storageRoot: "",
            builderAddress: builderAddress,
            split: AccountabilitySplit(userPercent, builderPercent),
            active: true,
            mintedAt: block.timestamp
        });

        _ensNameToTokenId[label] = tokenId;
        _ownerTokenIds[agentOwner].push(tokenId);

        emit AgentMinted(tokenId, agentOwner, ensName, subnode, userPercent, builderPercent);
    }

    function updateStorageRoot(uint256 tokenId, string calldata storageRoot) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        _agents[tokenId].storageRoot = storageRoot;

        try PUBLIC_RESOLVER.setText(_agents[tokenId].ensNode, "aegis.storageIndex", storageRoot) {} catch {}

        emit StorageRootUpdated(tokenId, storageRoot);
    }

    function updateReputation(
        uint256 tokenId,
        string calldata reputation,
        string calldata totalDecisions,
        string calldata lastVerdict,
        string calldata flaggedCount
    ) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        bytes32 node = _agents[tokenId].ensNode;

        try PUBLIC_RESOLVER.setText(node, "aegis.reputation", reputation) {} catch {}
        try PUBLIC_RESOLVER.setText(node, "aegis.totalDecisions", totalDecisions) {} catch {}
        try PUBLIC_RESOLVER.setText(node, "aegis.lastVerdict", lastVerdict) {} catch {}
        try PUBLIC_RESOLVER.setText(node, "aegis.flaggedCount", flaggedCount) {} catch {}
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

    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint160(addr) >> (8 * (19 - i))));
            buffer[2 + i * 2] = _hexChar(uint8(b) >> 4);
            buffer[3 + i * 2] = _hexChar(uint8(b) & 0x0f);
        }
        return string(buffer);
    }

    function _uint256ToHex(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0x0";
        bytes memory buffer = new bytes(66);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            bytes1 b = bytes1(uint8(value >> (8 * (31 - i))));
            buffer[2 + i * 2] = _hexChar(uint8(b) >> 4);
            buffer[3 + i * 2] = _hexChar(uint8(b) & 0x0f);
        }
        return string(buffer);
    }

    function _hexChar(uint8 value) internal pure returns (bytes1) {
        return value < 10 ? bytes1(uint8(48 + value)) : bytes1(uint8(87 + value));
    }
}
