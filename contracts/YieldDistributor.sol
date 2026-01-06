// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldDistributor
 * @dev Distributes yield to RWA token holders
 * @notice DEMO contract for Mantle Hackathon - uses mock distribution logic
 */
contract YieldDistributor is Ownable, ReentrancyGuard {
    // ============ Structs ============
    struct Distribution {
        address token;
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 timestamp;
        string distributionType; // "Monthly", "Quarterly", "Maturity"
    }

    struct ScheduledDistribution {
        address token;
        uint256 amount;
        uint256 scheduledDate;
        bool executed;
    }

    // ============ State Variables ============
    Distribution[] public distributions;
    ScheduledDistribution[] public scheduledDistributions;

    mapping(address => uint256) public totalDistributed;
    mapping(address => uint256) public distributionCount;

    // ============ Events ============
    event YieldDistributed(
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 timestamp,
        string distributionType
    );

    event DistributionScheduled(
        uint256 indexed scheduleId,
        address indexed token,
        uint256 amount,
        uint256 scheduledDate
    );

    event DistributionExecuted(
        uint256 indexed scheduleId,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event DistributionCancelled(
        uint256 indexed scheduleId,
        address indexed token
    );

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}

    // ============ Distribution Functions ============

    /**
     * @dev Record a yield distribution (mock - records event only)
     * @param _token RWA token address
     * @param _totalAmount Total yield amount distributed
     * @param _recipientCount Number of recipients
     * @param _distributionType Type of distribution
     */
    function distributeYield(
        address _token,
        uint256 _totalAmount,
        uint256 _recipientCount,
        string calldata _distributionType
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_totalAmount > 0, "Amount must be > 0");
        require(_recipientCount > 0, "Recipients must be > 0");

        distributions.push(Distribution({
            token: _token,
            totalAmount: _totalAmount,
            recipientCount: _recipientCount,
            timestamp: block.timestamp,
            distributionType: _distributionType
        }));

        totalDistributed[_token] += _totalAmount;
        distributionCount[_token]++;

        emit YieldDistributed(
            _token,
            _totalAmount,
            _recipientCount,
            block.timestamp,
            _distributionType
        );
    }

    /**
     * @dev Simplified distribute function (for backward compatibility)
     */
    function distributeYield(
        address _token,
        uint256 _totalAmount,
        uint256 _recipientCount
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_totalAmount > 0, "Amount must be > 0");
        require(_recipientCount > 0, "Recipients must be > 0");

        distributions.push(Distribution({
            token: _token,
            totalAmount: _totalAmount,
            recipientCount: _recipientCount,
            timestamp: block.timestamp,
            distributionType: "Monthly"
        }));

        totalDistributed[_token] += _totalAmount;
        distributionCount[_token]++;

        emit YieldDistributed(
            _token,
            _totalAmount,
            _recipientCount,
            block.timestamp,
            "Monthly"
        );
    }

    // ============ Scheduling Functions ============

    /**
     * @dev Schedule a future distribution
     * @param _token Token address
     * @param _amount Distribution amount
     * @param _scheduledDate Scheduled date (unix timestamp)
     */
    function scheduleDistribution(
        address _token,
        uint256 _amount,
        uint256 _scheduledDate
    ) external onlyOwner returns (uint256) {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be > 0");
        require(_scheduledDate > block.timestamp, "Date must be in the future");

        uint256 scheduleId = scheduledDistributions.length;

        scheduledDistributions.push(ScheduledDistribution({
            token: _token,
            amount: _amount,
            scheduledDate: _scheduledDate,
            executed: false
        }));

        emit DistributionScheduled(scheduleId, _token, _amount, _scheduledDate);

        return scheduleId;
    }

    /**
     * @dev Execute a scheduled distribution
     * @param _scheduleId Schedule ID to execute
     * @param _recipientCount Number of recipients
     */
    function executeScheduledDistribution(
        uint256 _scheduleId,
        uint256 _recipientCount
    ) external onlyOwner {
        require(_scheduleId < scheduledDistributions.length, "Invalid schedule ID");

        ScheduledDistribution storage scheduled = scheduledDistributions[_scheduleId];
        require(!scheduled.executed, "Already executed");
        require(block.timestamp >= scheduled.scheduledDate, "Too early");

        scheduled.executed = true;

        distributions.push(Distribution({
            token: scheduled.token,
            totalAmount: scheduled.amount,
            recipientCount: _recipientCount,
            timestamp: block.timestamp,
            distributionType: "Scheduled"
        }));

        totalDistributed[scheduled.token] += scheduled.amount;
        distributionCount[scheduled.token]++;

        emit DistributionExecuted(
            _scheduleId,
            scheduled.token,
            scheduled.amount,
            block.timestamp
        );
    }

    /**
     * @dev Cancel a scheduled distribution
     * @param _scheduleId Schedule ID to cancel
     */
    function cancelScheduledDistribution(uint256 _scheduleId) external onlyOwner {
        require(_scheduleId < scheduledDistributions.length, "Invalid schedule ID");

        ScheduledDistribution storage scheduled = scheduledDistributions[_scheduleId];
        require(!scheduled.executed, "Already executed");

        scheduled.executed = true; // Mark as executed to prevent future execution

        emit DistributionCancelled(_scheduleId, scheduled.token);
    }

    // ============ View Functions ============

    /**
     * @dev Get total distributions count
     */
    function getDistributionsCount() external view returns (uint256) {
        return distributions.length;
    }

    /**
     * @dev Get distribution by index
     * @param _index Distribution index
     */
    function getDistribution(uint256 _index) external view returns (
        address token,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 timestamp,
        string memory distributionType
    ) {
        require(_index < distributions.length, "Index out of bounds");
        Distribution memory dist = distributions[_index];
        return (
            dist.token,
            dist.totalAmount,
            dist.recipientCount,
            dist.timestamp,
            dist.distributionType
        );
    }

    /**
     * @dev Get scheduled distributions count
     */
    function getScheduledCount() external view returns (uint256) {
        return scheduledDistributions.length;
    }

    /**
     * @dev Get scheduled distribution by index
     * @param _index Schedule index
     */
    function getScheduledDistribution(uint256 _index) external view returns (
        address token,
        uint256 amount,
        uint256 scheduledDate,
        bool executed
    ) {
        require(_index < scheduledDistributions.length, "Index out of bounds");
        ScheduledDistribution memory scheduled = scheduledDistributions[_index];
        return (
            scheduled.token,
            scheduled.amount,
            scheduled.scheduledDate,
            scheduled.executed
        );
    }

    /**
     * @dev Get token distribution stats
     * @param _token Token address
     */
    function getTokenStats(address _token) external view returns (
        uint256 _totalDistributed,
        uint256 _distributionCount
    ) {
        return (
            totalDistributed[_token],
            distributionCount[_token]
        );
    }

    /**
     * @dev Get recent distributions for a token
     * @param _token Token address
     * @param _limit Max number of distributions to return
     */
    function getRecentDistributions(
        address _token,
        uint256 _limit
    ) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory recipients
    ) {
        // Count matching distributions
        uint256 count = 0;
        for (uint256 i = 0; i < distributions.length && count < _limit; i++) {
            if (distributions[i].token == _token) {
                count++;
            }
        }

        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        recipients = new uint256[](count);

        // Fill arrays (from most recent)
        uint256 idx = 0;
        for (uint256 i = distributions.length; i > 0 && idx < count; i--) {
            if (distributions[i - 1].token == _token) {
                amounts[idx] = distributions[i - 1].totalAmount;
                timestamps[idx] = distributions[i - 1].timestamp;
                recipients[idx] = distributions[i - 1].recipientCount;
                idx++;
            }
        }

        return (amounts, timestamps, recipients);
    }

    // ============ Emergency Functions ============

    /**
     * @dev Emergency withdrawal of any ERC20 tokens sent to this contract
     * @param _token Token to withdraw
     */
    function emergencyWithdraw(address _token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");

        bool success = IERC20(_token).transfer(owner(), balance);
        require(success, "Transfer failed");
    }

    /**
     * @dev Emergency withdrawal of native token (MNT)
     */
    function emergencyWithdrawNative() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Allow receiving native token
    receive() external payable {}
}
