// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAssetRegistry {
    function assets(bytes32 assetId)
        external
        view
        returns (
            string memory name,
            string memory assetType,
            uint256 expectedApyBps,
            uint256 targetAumUsdCents,
            uint256 minimumInvestmentUsdCents,
            uint256 durationDays,
            uint256 priceUsdCents,
            uint256 riskScore,
            bytes32 metadataHash,
            address creator,
            uint256 createdAt,
            bool active
        );
}

/**
 * @title AssetVault
 * @dev Holds RWA token deposits per assetId using the AssetRegistry metadata.
 */
contract AssetVault is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rwaToken;
    IAssetRegistry public immutable registry;

    mapping(bytes32 => mapping(address => uint256)) public positions;
    mapping(bytes32 => uint256) public totalUnits;

    event Invested(bytes32 indexed assetId, address indexed user, uint256 units, uint256 amountRwa);
    event Redeemed(bytes32 indexed assetId, address indexed user, uint256 units, uint256 amountRwa);

    constructor(address _rwaToken, address _registry, address owner) Ownable(owner) {
        require(_rwaToken != address(0), "Invalid RWA token");
        require(_registry != address(0), "Invalid registry");
        rwaToken = IERC20(_rwaToken);
        registry = IAssetRegistry(_registry);
    }

    function quoteRwa(bytes32 assetId, uint256 units) public view returns (uint256) {
        (, , , , , , uint256 priceUsdCents, , , , , ) = registry.assets(assetId);
        return (units * priceUsdCents) / 100;
    }

    function getPosition(bytes32 assetId, address user) external view returns (uint256) {
        return positions[assetId][user];
    }

    function invest(bytes32 assetId, uint256 units) external {
        require(units > 0, "Units required");

        (, , , , uint256 minimumInvestmentUsdCents, , uint256 priceUsdCents, , , , , bool active) = registry.assets(assetId);
        require(active, "Asset inactive");

        uint256 amountRwa = (units * priceUsdCents) / 100;
        require(amountRwa > 0, "Amount too small");

        uint256 minimumRwa = minimumInvestmentUsdCents * 1e16;
        if (minimumRwa > 0) {
            require(amountRwa >= minimumRwa, "Below minimum");
        }

        positions[assetId][msg.sender] += units;
        totalUnits[assetId] += units;

        rwaToken.safeTransferFrom(msg.sender, address(this), amountRwa);

        emit Invested(assetId, msg.sender, units, amountRwa);
    }

    function redeem(bytes32 assetId, uint256 units) external {
        require(units > 0, "Units required");
        uint256 currentUnits = positions[assetId][msg.sender];
        require(currentUnits >= units, "Insufficient units");

        uint256 amountRwa = quoteRwa(assetId, units);

        positions[assetId][msg.sender] = currentUnits - units;
        totalUnits[assetId] -= units;

        rwaToken.safeTransfer(msg.sender, amountRwa);

        emit Redeemed(assetId, msg.sender, units, amountRwa);
    }
}
