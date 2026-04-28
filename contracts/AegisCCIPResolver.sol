// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AegisCCIPResolver is Ownable {
    string public gatewayUrl;

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    constructor(string memory _gatewayUrl) Ownable(msg.sender) {
        gatewayUrl = _gatewayUrl;
    }

    function setGatewayUrl(string calldata _gatewayUrl) external onlyOwner {
        gatewayUrl = _gatewayUrl;
    }

    function resolve(bytes calldata, bytes calldata data) external view returns (bytes memory) {
        string[] memory urls = new string[](1);
        urls[0] = gatewayUrl;
        revert OffchainLookup(address(this), urls, data, this.resolveCallback.selector, data);
    }

    function resolveCallback(
        bytes calldata response,
        bytes calldata
    ) external pure returns (bytes memory) {
        return abi.decode(response, (bytes));
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x9061b923;
    }
}
