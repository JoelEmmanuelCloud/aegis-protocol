// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AegisNameRegistry is Ownable {
    bytes32 public immutable baseNode;

    mapping(bytes32 => address) private _nodeOwner;
    mapping(string => bytes32) private _labelToNode;
    mapping(bytes32 => mapping(string => string)) private _texts;
    mapping(address => bool) private _authorized;

    event SubnodeRegistered(bytes32 indexed node, string label, address owner);
    event TextChanged(bytes32 indexed node, string indexed key, string value);

    error LabelTaken();
    error Unauthorized();

    constructor(bytes32 _baseNode) Ownable(msg.sender) {
        baseNode = _baseNode;
    }

    modifier onlyAuthorized() {
        if (!_authorized[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _;
    }

    function setAuthorized(address caller, bool authorized) external onlyOwner {
        _authorized[caller] = authorized;
    }

    function register(string calldata label, address subnodeOwner) external onlyAuthorized {
        bytes32 node = keccak256(abi.encodePacked(baseNode, keccak256(bytes(label))));
        if (_nodeOwner[node] != address(0)) revert LabelTaken();
        _nodeOwner[node] = subnodeOwner;
        _labelToNode[label] = node;
        emit SubnodeRegistered(node, label, subnodeOwner);
    }

    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external onlyAuthorized {
        _texts[node][key] = value;
        emit TextChanged(node, key, value);
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return _texts[node][key];
    }

    function nodeForLabel(string calldata label) external view returns (bytes32) {
        return _labelToNode[label];
    }

    function ownerOfNode(bytes32 node) external view returns (address) {
        return _nodeOwner[node];
    }
}
