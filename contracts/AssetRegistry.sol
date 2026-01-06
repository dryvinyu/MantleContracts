// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetRegistry
 * @dev Minimal on-chain registry for off-chain asset metadata.
 * @notice Stores a hash of off-chain metadata and key financial fields.
 */
contract AssetRegistry is Ownable {
    struct AssetRecord {
        string name;
        string assetType;
        uint256 expectedApyBps;
        uint256 targetAumUsdCents;
        uint256 minimumInvestmentUsdCents;
        uint256 durationDays;
        uint256 priceUsdCents;
        uint256 riskScore;
        bytes32 metadataHash;
        address creator;
        uint256 createdAt;
        bool active;
    }

    uint256 public assetCount;
    mapping(bytes32 => AssetRecord) public assets;

    event AssetRegistered(
        bytes32 indexed assetId,
        string name,
        string assetType,
        uint256 expectedApyBps,
        uint256 targetAumUsdCents,
        uint256 minimumInvestmentUsdCents,
        uint256 durationDays,
        uint256 priceUsdCents,
        uint256 riskScore,
        bytes32 metadataHash,
        address indexed creator
    );

    event AssetStatusUpdated(bytes32 indexed assetId, bool active);

    constructor(address owner) Ownable(owner) {}

    function registerAsset(
        string calldata name,
        string calldata assetType,
        uint256 expectedApyBps,
        uint256 targetAumUsdCents,
        uint256 minimumInvestmentUsdCents,
        uint256 durationDays,
        uint256 priceUsdCents,
        uint256 riskScore,
        bytes32 metadataHash
    ) external onlyOwner returns (bytes32 assetId) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(assetType).length > 0, "Type required");
        require(riskScore <= 100, "Risk score <= 100");

        assetId = keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                block.timestamp,
                name,
                assetType,
                assetCount
            )
        );

        assets[assetId] = AssetRecord({
            name: name,
            assetType: assetType,
            expectedApyBps: expectedApyBps,
            targetAumUsdCents: targetAumUsdCents,
            minimumInvestmentUsdCents: minimumInvestmentUsdCents,
            durationDays: durationDays,
            priceUsdCents: priceUsdCents,
            riskScore: riskScore,
            metadataHash: metadataHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        assetCount += 1;

        emit AssetRegistered(
            assetId,
            name,
            assetType,
            expectedApyBps,
            targetAumUsdCents,
            minimumInvestmentUsdCents,
            durationDays,
            priceUsdCents,
            riskScore,
            metadataHash,
            msg.sender
        );
    }

    function setAssetActive(bytes32 assetId, bool active) external onlyOwner {
        require(assets[assetId].createdAt != 0, "Asset not found");
        assets[assetId].active = active;
        emit AssetStatusUpdated(assetId, active);
    }
}
