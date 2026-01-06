// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlatformRWAToken
 * @dev Platform-wide RWA token used for all transactions on the platform
 * @notice Users exchange MNT/USDT/USDC/ETH for RWA tokens to invest in assets
 */
contract PlatformRWAToken is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Supported Tokens ============
    struct SupportedToken {
        address tokenAddress;   // Address (0x0 for native MNT)
        uint256 priceInUSD;     // Price in USD (scaled by 1e8, e.g., 1 USD = 1e8)
        uint8 decimals;         // Token decimals
        bool isActive;          // Is this token accepted
        string symbol;          // Token symbol for display
    }

    // Token ID => SupportedToken
    mapping(bytes32 => SupportedToken) public supportedTokens;
    bytes32[] public tokenIds;

    // RWA Token price in USD (scaled by 1e8)
    // 1 RWA = 1 USD by default
    uint256 public rwaTokenPriceUSD = 1e8;

    // Treasury address to receive payments
    address public treasury;

    // Total volume stats
    uint256 public totalVolumeUSD;
    uint256 public totalExchanges;

    // ============ Events ============
    event TokenExchanged(
        address indexed user,
        bytes32 indexed tokenId,
        uint256 paymentAmount,
        uint256 rwaAmount,
        uint256 timestamp
    );
    event TokenRedeemed(
        address indexed user,
        bytes32 indexed tokenId,
        uint256 rwaAmount,
        uint256 paymentAmount,
        uint256 timestamp
    );
    event SupportedTokenAdded(bytes32 indexed tokenId, address tokenAddress, string symbol);
    event SupportedTokenUpdated(bytes32 indexed tokenId, uint256 newPrice, bool isActive);
    event RWAPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    /**
     * @dev Constructor
     * @param _treasury Address to receive payments
     */
    constructor(address _treasury) ERC20("RealFi RWA Token", "RWA") Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;

        // Add default supported tokens
        // MNT (native token) - using address(0)
        _addSupportedToken(
            keccak256("MNT"),
            address(0),
            0.5e8,  // $0.50 per MNT (adjust based on market)
            18,
            "MNT"
        );
    }

    // ============ User Functions ============

    /**
     * @dev Exchange native MNT for RWA tokens
     */
    function exchangeMNT() external payable nonReentrant {
        require(msg.value > 0, "Must send MNT");

        bytes32 tokenId = keccak256("MNT");
        SupportedToken storage token = supportedTokens[tokenId];
        require(token.isActive, "MNT not accepted");

        // Calculate RWA amount
        // paymentValueUSD = msg.value * tokenPrice / 1e18 (adjust for decimals)
        // rwaAmount = paymentValueUSD / rwaTokenPriceUSD * 1e18
        uint256 paymentValueUSD = (msg.value * token.priceInUSD) / 1e18;
        uint256 rwaAmount = (paymentValueUSD * 1e18) / rwaTokenPriceUSD;

        require(rwaAmount > 0, "Amount too small");

        // Transfer MNT to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "MNT transfer failed");

        // Mint RWA tokens to user
        _mint(msg.sender, rwaAmount);

        // Update stats
        totalVolumeUSD += paymentValueUSD;
        totalExchanges++;

        emit TokenExchanged(msg.sender, tokenId, msg.value, rwaAmount, block.timestamp);
    }

    /**
     * @dev Exchange ERC20 token for RWA tokens
     * @param _tokenId Token identifier (keccak256 of symbol)
     * @param _amount Amount of token to exchange
     */
    function exchangeToken(bytes32 _tokenId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        SupportedToken storage token = supportedTokens[_tokenId];
        require(token.isActive, "Token not accepted");
        require(token.tokenAddress != address(0), "Use exchangeMNT for native token");

        // Calculate RWA amount
        uint256 paymentValueUSD = (_amount * token.priceInUSD) / (10 ** token.decimals);
        uint256 rwaAmount = (paymentValueUSD * 1e18) / rwaTokenPriceUSD;

        require(rwaAmount > 0, "Amount too small");

        // Transfer payment token from user to treasury
        IERC20(token.tokenAddress).safeTransferFrom(msg.sender, treasury, _amount);

        // Mint RWA tokens to user
        _mint(msg.sender, rwaAmount);

        // Update stats
        totalVolumeUSD += paymentValueUSD;
        totalExchanges++;

        emit TokenExchanged(msg.sender, _tokenId, _amount, rwaAmount, block.timestamp);
    }

    /**
     * @dev Redeem RWA tokens for a specific token (if supported)
     * @param _tokenId Token identifier to receive
     * @param _rwaAmount Amount of RWA to redeem
     * @notice This requires the treasury to have approved this contract
     */
    function redeemToken(bytes32 _tokenId, uint256 _rwaAmount) external nonReentrant {
        require(_rwaAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= _rwaAmount, "Insufficient RWA balance");

        SupportedToken storage token = supportedTokens[_tokenId];
        require(token.isActive, "Token not supported for redemption");

        // Calculate payment amount
        uint256 rwaValueUSD = (_rwaAmount * rwaTokenPriceUSD) / 1e18;
        uint256 paymentAmount;

        if (token.tokenAddress == address(0)) {
            // Native MNT
            paymentAmount = (rwaValueUSD * 1e18) / token.priceInUSD;
        } else {
            // ERC20
            paymentAmount = (rwaValueUSD * (10 ** token.decimals)) / token.priceInUSD;
        }

        require(paymentAmount > 0, "Amount too small");

        // Burn RWA tokens
        _burn(msg.sender, _rwaAmount);

        // Transfer payment to user
        if (token.tokenAddress == address(0)) {
            // Native MNT - requires treasury to fund this contract
            require(address(this).balance >= paymentAmount, "Insufficient MNT in contract");
            (bool success, ) = msg.sender.call{value: paymentAmount}("");
            require(success, "MNT transfer failed");
        } else {
            // ERC20 - requires treasury approval
            IERC20(token.tokenAddress).safeTransferFrom(treasury, msg.sender, paymentAmount);
        }

        emit TokenRedeemed(msg.sender, _tokenId, _rwaAmount, paymentAmount, block.timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @dev Add a supported token
     * @param _tokenId Unique identifier (use keccak256 of symbol)
     * @param _tokenAddress Token contract address (address(0) for native)
     * @param _priceInUSD Price in USD (scaled by 1e8)
     * @param _decimals Token decimals
     * @param _symbol Token symbol
     */
    function addSupportedToken(
        bytes32 _tokenId,
        address _tokenAddress,
        uint256 _priceInUSD,
        uint8 _decimals,
        string memory _symbol
    ) external onlyOwner {
        _addSupportedToken(_tokenId, _tokenAddress, _priceInUSD, _decimals, _symbol);
    }

    function _addSupportedToken(
        bytes32 _tokenId,
        address _tokenAddress,
        uint256 _priceInUSD,
        uint8 _decimals,
        string memory _symbol
    ) internal {
        require(_priceInUSD > 0, "Price must be > 0");
        require(supportedTokens[_tokenId].priceInUSD == 0, "Token already exists");

        supportedTokens[_tokenId] = SupportedToken({
            tokenAddress: _tokenAddress,
            priceInUSD: _priceInUSD,
            decimals: _decimals,
            isActive: true,
            symbol: _symbol
        });

        tokenIds.push(_tokenId);

        emit SupportedTokenAdded(_tokenId, _tokenAddress, _symbol);
    }

    /**
     * @dev Update token price and status
     * @param _tokenId Token identifier
     * @param _newPrice New price in USD (scaled by 1e8)
     * @param _isActive Whether token is accepted
     */
    function updateSupportedToken(
        bytes32 _tokenId,
        uint256 _newPrice,
        bool _isActive
    ) external onlyOwner {
        require(supportedTokens[_tokenId].priceInUSD > 0, "Token not found");
        require(_newPrice > 0, "Price must be > 0");

        supportedTokens[_tokenId].priceInUSD = _newPrice;
        supportedTokens[_tokenId].isActive = _isActive;

        emit SupportedTokenUpdated(_tokenId, _newPrice, _isActive);
    }

    /**
     * @dev Update RWA token price
     * @param _newPrice New price in USD (scaled by 1e8)
     */
    function updateRWAPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be > 0");
        uint256 oldPrice = rwaTokenPriceUSD;
        rwaTokenPriceUSD = _newPrice;
        emit RWAPriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Fund contract with MNT for redemptions
     */
    function fundMNT() external payable onlyOwner {
        // Just receive MNT
    }

    /**
     * @dev Withdraw MNT from contract
     * @param _amount Amount to withdraw
     */
    function withdrawMNT(uint256 _amount) external onlyOwner nonReentrant {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Emergency withdraw ERC20 tokens
     * @param _token Token address
     */
    function emergencyWithdraw(address _token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No balance");
        IERC20(_token).safeTransfer(owner(), balance);
    }

    // ============ View Functions ============

    /**
     * @dev Get token ID from symbol
     * @param _symbol Token symbol
     */
    function getTokenId(string memory _symbol) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_symbol));
    }

    /**
     * @dev Get supported token info
     * @param _tokenId Token identifier
     */
    function getTokenInfo(bytes32 _tokenId) external view returns (
        address tokenAddress,
        uint256 priceInUSD,
        uint8 decimals,
        bool isActive,
        string memory symbol
    ) {
        SupportedToken storage token = supportedTokens[_tokenId];
        return (
            token.tokenAddress,
            token.priceInUSD,
            token.decimals,
            token.isActive,
            token.symbol
        );
    }

    /**
     * @dev Get all supported token IDs
     */
    function getSupportedTokenIds() external view returns (bytes32[] memory) {
        return tokenIds;
    }

    /**
     * @dev Calculate RWA amount for a given payment
     * @param _tokenId Token to pay with
     * @param _paymentAmount Amount of payment token
     */
    function calculateRWAAmount(bytes32 _tokenId, uint256 _paymentAmount) external view returns (uint256) {
        SupportedToken storage token = supportedTokens[_tokenId];
        if (!token.isActive || token.priceInUSD == 0) return 0;

        uint256 paymentValueUSD;
        if (token.tokenAddress == address(0)) {
            paymentValueUSD = (_paymentAmount * token.priceInUSD) / 1e18;
        } else {
            paymentValueUSD = (_paymentAmount * token.priceInUSD) / (10 ** token.decimals);
        }

        return (paymentValueUSD * 1e18) / rwaTokenPriceUSD;
    }

    /**
     * @dev Calculate payment amount for redeeming RWA
     * @param _tokenId Token to receive
     * @param _rwaAmount Amount of RWA to redeem
     */
    function calculatePaymentAmount(bytes32 _tokenId, uint256 _rwaAmount) external view returns (uint256) {
        SupportedToken storage token = supportedTokens[_tokenId];
        if (!token.isActive || token.priceInUSD == 0) return 0;

        uint256 rwaValueUSD = (_rwaAmount * rwaTokenPriceUSD) / 1e18;

        if (token.tokenAddress == address(0)) {
            return (rwaValueUSD * 1e18) / token.priceInUSD;
        } else {
            return (rwaValueUSD * (10 ** token.decimals)) / token.priceInUSD;
        }
    }

    /**
     * @dev Get platform stats
     */
    function getStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalVolumeUSD,
        uint256 _totalExchanges,
        uint256 _rwaPrice
    ) {
        return (totalSupply(), totalVolumeUSD, totalExchanges, rwaTokenPriceUSD);
    }

    // Receive MNT
    receive() external payable {}
}
