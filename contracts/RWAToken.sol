// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWAToken
 * @dev Tokenized Real World Asset with yield metadata
 * @notice DEMO contract for Mantle Hackathon
 */
contract RWAToken is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============
    enum AssetStatus { Active, Maturing, Matured, Paused }

    // ============ Asset Metadata ============
    string public assetType;        // "Bonds", "RealEstate", "Invoices", "CashFlow"
    uint256 public expectedAPY;     // Basis points (480 = 4.80%)
    uint256 public riskScore;       // 0-100
    uint256 public duration;        // Lock duration in seconds
    uint256 public maturityDate;    // Unix timestamp when asset matures
    uint256 public nextPayoutDate;  // Unix timestamp
    uint256 public yieldConfidence; // 0-100 confidence score
    uint256 public totalAUM;        // Total Assets Under Management in USD (scaled by 1e18)
    uint256 public minimumInvestment; // Minimum investment amount in USD (scaled by 1e18)
    AssetStatus public status;      // Current status of the asset

    // ============ Payment Token ============
    IERC20 public paymentToken;     // USDC/USDT for investments

    // ============ Yield Breakdown ============
    struct YieldComponent {
        string name;
        int256 value;       // Can be negative for fees (basis points)
        string description;
    }

    YieldComponent[] public yieldComponents;

    // ============ Historical Data ============
    struct PayoutRecord {
        uint256 date;
        uint256 amount;
        uint256 recipientCount;
    }

    PayoutRecord[] public payoutHistory;

    // ============ Investment Tracking ============
    mapping(address => uint256) public investmentTime;  // When user invested
    mapping(address => uint256) public investmentAmount; // How much user invested (in payment token)

    // ============ Events ============
    event APYUpdated(uint256 oldAPY, uint256 newAPY, uint256 timestamp);
    event PayoutScheduled(uint256 date, uint256 estimatedAmount);
    event PayoutExecuted(uint256 date, uint256 amount, uint256 recipientCount);
    event RiskScoreUpdated(uint256 oldScore, uint256 newScore);
    event YieldConfidenceUpdated(uint256 oldConfidence, uint256 newConfidence);
    event YieldComponentAdded(string name, int256 value);
    event StatusUpdated(AssetStatus oldStatus, AssetStatus newStatus);
    event Invested(address indexed user, uint256 paymentAmount, uint256 tokenAmount);
    event Redeemed(address indexed user, uint256 tokenAmount, uint256 paymentAmount);

    /**
     * @dev Constructor
     * @param _name Token name (e.g., "US Treasury 2Y Tokenized")
     * @param _symbol Token symbol (e.g., "mUSTB2Y")
     * @param _assetType Type of real-world asset ("Bonds", "RealEstate", "Invoices", "CashFlow")
     * @param _expectedAPY Expected APY in basis points (480 = 4.80%)
     * @param _riskScore Risk score (0-100)
     * @param _duration Lock duration in seconds
     * @param _totalAUM Initial AUM in USD (scaled by 1e18)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _assetType,
        uint256 _expectedAPY,
        uint256 _riskScore,
        uint256 _duration,
        uint256 _totalAUM
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_riskScore <= 100, "Risk score must be <= 100");
        require(_expectedAPY <= 10000, "APY must be <= 100%");

        assetType = _assetType;
        expectedAPY = _expectedAPY;
        riskScore = _riskScore;
        duration = _duration;
        maturityDate = block.timestamp + _duration;
        nextPayoutDate = block.timestamp + 30 days;
        yieldConfidence = 85; // Default confidence
        totalAUM = _totalAUM;
        minimumInvestment = 100 * 1e18; // Default $100 minimum
        status = AssetStatus.Active;

        // Mint initial supply to deployer (for demo purposes)
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }

    // ============ Investment Functions ============

    /**
     * @dev Set the payment token (USDC/USDT) - call after deployment
     * @param _paymentToken Address of the payment token
     */
    function setPaymentToken(address _paymentToken) external onlyOwner {
        require(_paymentToken != address(0), "Invalid token address");
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @dev Invest in the RWA token
     * @param _amount Amount of payment token to invest
     */
    function invest(uint256 _amount) external nonReentrant {
        require(status == AssetStatus.Active, "Asset not active");
        require(address(paymentToken) != address(0), "Payment token not set");
        require(_amount >= minimumInvestment, "Below minimum investment");

        // Transfer payment token from user
        paymentToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate RWA tokens to mint (1:1 for simplicity)
        uint256 tokensToMint = _amount;

        // Update tracking
        investmentTime[msg.sender] = block.timestamp;
        investmentAmount[msg.sender] += _amount;
        totalAUM += _amount;

        // Mint RWA tokens to user
        _mint(msg.sender, tokensToMint);

        emit Invested(msg.sender, _amount, tokensToMint);
    }

    /**
     * @dev Redeem RWA tokens for payment token
     * @param _tokenAmount Amount of RWA tokens to redeem
     */
    function redeem(uint256 _tokenAmount) external nonReentrant {
        require(balanceOf(msg.sender) >= _tokenAmount, "Insufficient balance");
        require(address(paymentToken) != address(0), "Payment token not set");

        // Check if lock period has passed (skip for flexible duration)
        if (duration > 0) {
            require(
                block.timestamp >= investmentTime[msg.sender] + duration,
                "Lock period not ended"
            );
        }

        // Calculate payment amount (1:1 for simplicity, could add yield here)
        uint256 paymentAmount = _tokenAmount;

        // Update tracking
        if (investmentAmount[msg.sender] >= _tokenAmount) {
            investmentAmount[msg.sender] -= _tokenAmount;
        } else {
            investmentAmount[msg.sender] = 0;
        }
        totalAUM -= _tokenAmount;

        // Burn RWA tokens
        _burn(msg.sender, _tokenAmount);

        // Transfer payment token to user
        paymentToken.safeTransfer(msg.sender, paymentAmount);

        emit Redeemed(msg.sender, _tokenAmount, paymentAmount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update asset status
     * @param _newStatus New status
     */
    function updateStatus(AssetStatus _newStatus) external onlyOwner {
        AssetStatus oldStatus = status;
        status = _newStatus;
        emit StatusUpdated(oldStatus, _newStatus);
    }

    /**
     * @dev Update expected APY
     * @param _newAPY New APY in basis points
     */
    function updateAPY(uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 10000, "APY must be <= 100%");
        uint256 oldAPY = expectedAPY;
        expectedAPY = _newAPY;
        emit APYUpdated(oldAPY, _newAPY, block.timestamp);
    }

    /**
     * @dev Update risk score
     * @param _newScore New risk score (0-100)
     */
    function updateRiskScore(uint256 _newScore) external onlyOwner {
        require(_newScore <= 100, "Risk score must be <= 100");
        uint256 oldScore = riskScore;
        riskScore = _newScore;
        emit RiskScoreUpdated(oldScore, _newScore);
    }

    /**
     * @dev Update yield confidence
     * @param _newConfidence New confidence score (0-100)
     */
    function updateYieldConfidence(uint256 _newConfidence) external onlyOwner {
        require(_newConfidence <= 100, "Confidence must be <= 100");
        uint256 oldConfidence = yieldConfidence;
        yieldConfidence = _newConfidence;
        emit YieldConfidenceUpdated(oldConfidence, _newConfidence);
    }

    /**
     * @dev Update minimum investment
     * @param _newMinimum New minimum (scaled by 1e18)
     */
    function updateMinimumInvestment(uint256 _newMinimum) external onlyOwner {
        minimumInvestment = _newMinimum;
    }

    /**
     * @dev Schedule next payout
     * @param _date Payout date (unix timestamp)
     * @param _estimatedAmount Estimated payout amount
     */
    function scheduleNextPayout(uint256 _date, uint256 _estimatedAmount) external onlyOwner {
        require(_date > block.timestamp, "Date must be in the future");
        nextPayoutDate = _date;
        emit PayoutScheduled(_date, _estimatedAmount);
    }

    /**
     * @dev Record a payout execution (for demo/tracking purposes)
     * @param _amount Total amount distributed
     * @param _recipientCount Number of recipients
     */
    function recordPayout(uint256 _amount, uint256 _recipientCount) external onlyOwner {
        payoutHistory.push(PayoutRecord({
            date: block.timestamp,
            amount: _amount,
            recipientCount: _recipientCount
        }));

        // Schedule next payout
        nextPayoutDate = block.timestamp + 30 days;

        emit PayoutExecuted(block.timestamp, _amount, _recipientCount);
    }

    /**
     * @dev Add yield component (for yield breakdown)
     * @param _name Component name
     * @param _value Value in basis points (can be negative for fees)
     * @param _description Description of the component
     */
    function addYieldComponent(
        string memory _name,
        int256 _value,
        string memory _description
    ) external onlyOwner {
        yieldComponents.push(YieldComponent({
            name: _name,
            value: _value,
            description: _description
        }));
        emit YieldComponentAdded(_name, _value);
    }

    /**
     * @dev Clear all yield components (to reset)
     */
    function clearYieldComponents() external onlyOwner {
        delete yieldComponents;
    }

    /**
     * @dev Update AUM
     * @param _newAUM New total AUM (scaled by 1e18)
     */
    function updateAUM(uint256 _newAUM) external onlyOwner {
        totalAUM = _newAUM;
    }

    /**
     * @dev Emergency withdrawal of any ERC20 tokens
     * @param _token Token to withdraw
     */
    function emergencyWithdraw(address _token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No balance");
        IERC20(_token).safeTransfer(owner(), balance);
    }

    // ============ View Functions ============

    /**
     * @dev Get basic asset info
     */
    function getAssetInfo() external view returns (
        string memory _assetType,
        uint256 _expectedAPY,
        uint256 _riskScore,
        uint256 _duration,
        uint256 _nextPayoutDate,
        uint8 _status
    ) {
        return (
            assetType,
            expectedAPY,
            riskScore,
            duration,
            nextPayoutDate,
            uint8(status)
        );
    }

    /**
     * @dev Get extended asset info
     */
    function getExtendedInfo() external view returns (
        uint256 _yieldConfidence,
        uint256 _totalAUM,
        uint256 _minimumInvestment,
        uint256 _payoutCount,
        uint256 _maturityDate
    ) {
        return (
            yieldConfidence,
            totalAUM,
            minimumInvestment,
            payoutHistory.length,
            maturityDate
        );
    }

    /**
     * @dev Get user investment info
     * @param _user User address
     */
    function getUserInvestment(address _user) external view returns (
        uint256 _balance,
        uint256 _investmentTime,
        uint256 _investmentAmount,
        bool _canRedeem
    ) {
        bool canRedeem = duration == 0 || block.timestamp >= investmentTime[_user] + duration;
        return (
            balanceOf(_user),
            investmentTime[_user],
            investmentAmount[_user],
            canRedeem
        );
    }

    /**
     * @dev Get yield components count
     */
    function getYieldComponentsCount() external view returns (uint256) {
        return yieldComponents.length;
    }

    /**
     * @dev Get specific yield component
     * @param index Component index
     */
    function getYieldComponent(uint256 index) external view returns (
        string memory name,
        int256 value,
        string memory description
    ) {
        require(index < yieldComponents.length, "Index out of bounds");
        YieldComponent memory component = yieldComponents[index];
        return (component.name, component.value, component.description);
    }

    /**
     * @dev Get payout history count
     */
    function getPayoutHistoryCount() external view returns (uint256) {
        return payoutHistory.length;
    }

    /**
     * @dev Get specific payout record
     * @param index Payout index
     */
    function getPayoutRecord(uint256 index) external view returns (
        uint256 date,
        uint256 amount,
        uint256 recipientCount
    ) {
        require(index < payoutHistory.length, "Index out of bounds");
        PayoutRecord memory record = payoutHistory[index];
        return (record.date, record.amount, record.recipientCount);
    }

    /**
     * @dev Calculate net APY from components
     */
    function calculateNetAPY() external view returns (int256) {
        int256 netAPY = 0;
        for (uint256 i = 0; i < yieldComponents.length; i++) {
            netAPY += yieldComponents[i].value;
        }
        return netAPY;
    }

    /**
     * @dev Check if asset is matured
     */
    function isMatured() external view returns (bool) {
        return block.timestamp >= maturityDate;
    }

    /**
     * @dev Get risk level string
     */
    function getRiskLevel() external view returns (string memory) {
        if (riskScore < 20) return "Low";
        if (riskScore < 50) return "Medium";
        return "High";
    }
}
