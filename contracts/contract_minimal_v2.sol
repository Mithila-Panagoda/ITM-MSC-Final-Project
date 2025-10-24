// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
  CharityContractMinimal.sol
  - Streamlined version with only essential functions
  - Removed ERC1155, tokenized goods, and unused features
  - Focus on core charity/campaign/donation functionality
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CharityContractMinimal is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    uint256 public charityCount;
    uint256 public campaignCount;
    uint256 public donationCount;
    uint256 public campaignEventCount;

    uint256 public withdrawalTimelock = 24 hours;

    struct Charity {
        uint256 id;
        address wallet;
        string name;
        string metadataURI;
        bool approved;
        uint256 createdAt;
    }

    enum CampaignStatus { Created, Active, Ended }

    struct Campaign {
        uint256 id;
        uint256 charityId;
        uint256 goalAmount;
        uint256 startAt;
        uint256 endAt;
        uint256 createdAt;
        CampaignStatus status;
        string title;
        string description;
    }

    struct Donation {
        uint256 id;
        address donor;
        uint256 charityId;
        uint256 campaignId;
        uint256 amountWei;
        uint256 erc20Amount;
        uint256 actualAmountUSD; // Actual dollar amount donated
        uint256 timestamp;
        address erc20Token;
    }

    struct CampaignEvent {
        uint256 id;
        uint256 campaignId;
        uint256 charityId;
        uint256 amountUSD; // Amount allocated in USD
        uint256 timestamp;
        string title;
        string description;
    }

    mapping(uint256 => Charity) public charities;
    mapping(address => uint256) public charityOfWallet;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation) public donations;
    mapping(uint256 => CampaignEvent) public campaignEvents;

    mapping(uint256 => uint256) public charityNativeBalance;
    mapping(uint256 => mapping(address => uint256)) public charityERC20Balance;
    mapping(uint256 => uint256) public charityNextWithdrawTime;
    mapping(address => bool) public acceptedERC20;

    event CharityRegistered(uint256 indexed charityId, address indexed wallet, string name);
    event CampaignCreated(uint256 indexed campaignId, uint256 indexed charityId, string title);
    event DonationReceived(uint256 indexed donationId, address indexed donor, uint256 charityId, uint256 amountWei, address erc20Token, uint256 erc20Amount, uint256 actualAmountUSD);
    event CampaignEventCreated(uint256 indexed eventId, uint256 indexed campaignId, uint256 indexed charityId, uint256 amountUSD, string title);
    event FundsWithdrawn(uint256 indexed charityId, address indexed to, uint256 amountWei);
    event ERC20Withdrawn(uint256 indexed charityId, address indexed token, uint256 amount);

    modifier onlyApprovedCharity(uint256 charityId) {
        require(charities[charityId].id != 0, "Not found");
        require(charities[charityId].approved, "Not approved");
        require(charities[charityId].wallet == msg.sender, "Unauthorized");
        _;
    }

    modifier campaignExists(uint256 campaignId) {
        require(campaigns[campaignId].id != 0, "Not found");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // --- Admin ---
    function setAcceptedERC20(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");
        acceptedERC20[token] = accepted;
    }

    // --- Charity registration ---
    function registerCharity(address wallet, string calldata name, string calldata metadataURI) external returns (uint256) {
        require(wallet != address(0), "Invalid wallet");
        // Removed: require(charityOfWallet[wallet] == 0, "Already registered");
        // Allow same wallet to register multiple charities

        charityCount++;
        charities[charityCount] = Charity({
            id: charityCount,
            wallet: wallet,
            name: name,
            metadataURI: metadataURI,
            approved: true, // Auto-approve for simplicity
            createdAt: block.timestamp
        });

        // Don't update charityOfWallet mapping to allow multiple charities per wallet
        emit CharityRegistered(charityCount, wallet, name);
        return charityCount;
    }

    // --- Campaign management ---
    function createCampaign(
        uint256 charityId,
        string calldata title,
        string calldata description,
        uint256 goalAmountWei,
        uint256 startAt,
        uint256 endAt
    ) external returns (uint256) {
        // Allow any wallet to create campaigns for any charity
        // This enables admin wallet to create campaigns for all charities
        require(charities[charityId].id != 0, "Charity not found");
        require(charities[charityId].approved, "Not approved");
        require(endAt == 0 || endAt > startAt, "Invalid dates");

        campaignCount++;
        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            charityId: charityId,
            title: title,
            description: description,
            goalAmount: goalAmountWei,
            startAt: startAt,
            endAt: endAt,
            status: CampaignStatus.Active, // Auto-activate for simplicity
            createdAt: block.timestamp
        });

        emit CampaignCreated(campaignCount, charityId, title);
        return campaignCount;
    }

    // --- Native donations ---
    function donateNative(uint256 campaignId, uint256 actualAmountUSD) external payable nonReentrant campaignExists(campaignId) {
        require(msg.value >= 0.001 ether, "Minimum 0.001 ETH required"); // Fixed small amount
        require(actualAmountUSD > 0, "USD amount > 0");
        Campaign storage camp = campaigns[campaignId];
        require(camp.status == CampaignStatus.Active, "Not active");

        uint256 charityId = camp.charityId;

        donationCount++;
        donations[donationCount] = Donation({
            id: donationCount,
            donor: msg.sender,
            charityId: charityId,
            campaignId: campaignId,
            amountWei: msg.value,
            erc20Token: address(0),
            erc20Amount: 0,
            actualAmountUSD: actualAmountUSD,
            timestamp: block.timestamp
        });

        charityNativeBalance[charityId] += msg.value;
        charityNextWithdrawTime[charityId] = block.timestamp + withdrawalTimelock;

        emit DonationReceived(donationCount, msg.sender, charityId, msg.value, address(0), 0, actualAmountUSD);
    }

    // --- ERC20 donations ---
    function donateERC20(uint256 campaignId, address tokenAddress, uint256 amount, uint256 minAmount, uint256 actualAmountUSD) external nonReentrant campaignExists(campaignId) {
        require(tokenAddress != address(0), "Invalid token");
        require(amount > 0, "Amount > 0");
        require(acceptedERC20[tokenAddress], "Not accepted");
        require(amount >= minAmount, "Too low");
        require(actualAmountUSD > 0, "USD amount > 0");

        Campaign storage camp = campaigns[campaignId];
        require(camp.status == CampaignStatus.Active, "Not active");
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);

        uint256 charityId = camp.charityId;
        charityERC20Balance[charityId][tokenAddress] += amount;
        charityNextWithdrawTime[charityId] = block.timestamp + withdrawalTimelock;

        donationCount++;
        donations[donationCount] = Donation({
            id: donationCount,
            donor: msg.sender,
            charityId: charityId,
            campaignId: campaignId,
            amountWei: 0,
            erc20Token: tokenAddress,
            erc20Amount: amount,
            actualAmountUSD: actualAmountUSD,
            timestamp: block.timestamp
        });

        emit DonationReceived(donationCount, msg.sender, charityId, 0, tokenAddress, amount, actualAmountUSD);
    }

    // --- Campaign Events ---
    function createCampaignEvent(uint256 campaignId, uint256 amountUSD, string memory title, string memory description) external nonReentrant campaignExists(campaignId) {
        Campaign storage camp = campaigns[campaignId];
        require(camp.status == CampaignStatus.Active, "Campaign not active");
        require(amountUSD > 0, "Amount > 0");
        require(bytes(title).length > 0, "Title required");
        
        uint256 charityId = camp.charityId;
        
        campaignEventCount++;
        campaignEvents[campaignEventCount] = CampaignEvent({
            id: campaignEventCount,
            campaignId: campaignId,
            charityId: charityId,
            amountUSD: amountUSD,
            timestamp: block.timestamp,
            title: title,
            description: description
        });

        emit CampaignEventCreated(campaignEventCount, campaignId, charityId, amountUSD, title);
    }

    // --- Withdrawals ---
    function withdrawNative(uint256 charityId, uint256 amountWei) external nonReentrant {
        require(charities[charityId].id != 0, "Not found");
        // Allow admin wallet to withdraw funds for any charity
        require(charities[charityId].wallet == msg.sender || msg.sender == owner(), "Unauthorized");
        require(block.timestamp >= charityNextWithdrawTime[charityId], "Locked");
        uint256 bal = charityNativeBalance[charityId];
        require(amountWei <= bal, "Insufficient");

        charityNativeBalance[charityId] = bal - amountWei;

        payable(msg.sender).sendValue(amountWei);
        emit FundsWithdrawn(charityId, msg.sender, amountWei);
    }

    function withdrawERC20(uint256 charityId, address tokenAddress, uint256 amount) external nonReentrant {
        require(tokenAddress != address(0), "Invalid token");
        require(charities[charityId].id != 0, "Not found");
        // Allow admin wallet to withdraw ERC20 funds for any charity
        require(charities[charityId].wallet == msg.sender || msg.sender == owner(), "Unauthorized");
        require(acceptedERC20[tokenAddress], "Not accepted");
        require(block.timestamp >= charityNextWithdrawTime[charityId], "Locked");

        uint256 bal = charityERC20Balance[charityId][tokenAddress];
        require(amount <= bal, "Insufficient");

        charityERC20Balance[charityId][tokenAddress] = bal - amount;
        IERC20(tokenAddress).safeTransfer(msg.sender, amount);

        emit ERC20Withdrawn(charityId, tokenAddress, amount);
    }

    receive() external payable {
        revert("Use donate");
    }

    fallback() external payable {
        revert("Use donate");
    }
}
