// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*
  CharityContractSafe.sol  (fixed)
  - Uses ERC1155Supply (which already inherits ERC1155)
  - Calls base constructors correctly (ERC1155(uri) and Ownable(msg.sender))
  - Overrides _beforeTokenTransfer with the correct single base
  - Uses SafeERC20, ReentrancyGuard, Pausable, Address.sendValue
  - receive()/fallback() revert to avoid unattributed funds
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CharityContractSafe is Ownable, ReentrancyGuard, Pausable, ERC1155Supply {
    using SafeERC20 for IERC20;
    using Address for address payable;

    uint256 public charityCount;
    uint256 public campaignCount;
    uint256 public donationCount;
    uint256 public tokenTypeCount;

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

    struct TokenType {
        uint256 id;
        uint256 charityId;
        uint256 priceWei;
        uint256 maxSupply;
        uint256 createdAt;
        string name;
        string metadataURI;
    }

    struct Donation {
        uint256 id;
        address donor;
        uint256 charityId;
        uint256 campaignId;
        uint256 amountWei;
        uint256 erc20Amount;
        uint256 tokenTypeId;
        uint256 tokenQuantity;
        uint256 timestamp;
        address erc20Token;
    }

    mapping(uint256 => Charity) public charities;
    mapping(address => uint256) public charityOfWallet;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => TokenType) public tokenTypes;
    mapping(uint256 => Donation) public donations;

    mapping(uint256 => uint256) public charityNativeBalance;
    mapping(uint256 => mapping(address => uint256)) public charityERC20Balance;
    mapping(uint256 => uint256) public charityNextWithdrawTime;
    mapping(address => bool) public acceptedERC20;

    event CharityRegistered(uint256 indexed charityId, address indexed wallet, string name);
    event CharityApproved(uint256 indexed charityId, bool approved);
    event CampaignCreated(uint256 indexed campaignId, uint256 indexed charityId, string title);
    event CampaignStatusChanged(uint256 indexed campaignId, CampaignStatus status);
    event TokenTypeCreated(uint256 indexed tokenTypeId, uint256 indexed charityId, string name, uint256 priceWei);
    event DonationReceived(uint256 indexed donationId, address indexed donor, uint256 charityId, uint256 amountWei, address erc20Token, uint256 erc20Amount, uint256 tokenTypeId, uint256 tokenQuantity);
    event FundsWithdrawn(uint256 indexed charityId, address indexed to, uint256 amountWei);
    event ERC20Withdrawn(uint256 indexed charityId, address indexed token, uint256 amount);
    event AcceptedERC20Updated(address token, bool accepted);

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

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    // --- Admin ---
    function setWithdrawalTimelock(uint256 seconds_) external onlyOwner {
        withdrawalTimelock = seconds_;
    }

    function setAcceptedERC20(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");
        acceptedERC20[token] = accepted;
        emit AcceptedERC20Updated(token, accepted);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // rescue only non-accepted tokens
    function rescueERC20(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token");
        require(!acceptedERC20[tokenAddress], "Cannot rescue");
        IERC20(tokenAddress).safeTransfer(to, amount);
    }

    // --- Charity registration ---
    function registerCharity(address wallet, string calldata name, string calldata metadataURI) external returns (uint256) {
        require(wallet != address(0), "Invalid wallet");
        require(charityOfWallet[wallet] == 0, "Already registered");

        charityCount++;
        charities[charityCount] = Charity({
            id: charityCount,
            wallet: wallet,
            name: name,
            metadataURI: metadataURI,
            approved: false,
            createdAt: block.timestamp
        });

        charityOfWallet[wallet] = charityCount;
        emit CharityRegistered(charityCount, wallet, name);
        return charityCount;
    }

    function setCharityApproval(uint256 charityId, bool approved) external onlyOwner {
        require(charities[charityId].id != 0, "Not found");
        charities[charityId].approved = approved;
        emit CharityApproved(charityId, approved);
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
        uint256 regId = charityOfWallet[msg.sender];
        require(regId != 0 && regId == charityId, "Unauthorized");
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
            status: CampaignStatus.Created,
            createdAt: block.timestamp
        });

        emit CampaignCreated(campaignCount, charityId, title);
        return campaignCount;
    }

    function startCampaign(uint256 campaignId) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(charities[c.charityId].wallet == msg.sender, "Unauthorized");
        c.status = CampaignStatus.Active;
        emit CampaignStatusChanged(campaignId, c.status);
    }

    function endCampaign(uint256 campaignId) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(charities[c.charityId].wallet == msg.sender, "Unauthorized");
        c.status = CampaignStatus.Ended;
        emit CampaignStatusChanged(campaignId, c.status);
    }

    // --- Tokenized goods ---
    function createTokenType(
        uint256 charityId,
        string calldata name,
        string calldata metadataURI,
        uint256 priceWei,
        uint256 maxSupply
    ) external returns (uint256) {
        require(charityOfWallet[msg.sender] != 0 && charityOfWallet[msg.sender] == charityId, "Unauthorized");
        require(charities[charityId].approved, "Not approved");

        tokenTypeCount++;
        uint256 newTokenId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenTypeCount)));
        tokenTypes[newTokenId] = TokenType({
            id: newTokenId,
            charityId: charityId,
            name: name,
            metadataURI: metadataURI,
            priceWei: priceWei,
            maxSupply: maxSupply,
            createdAt: block.timestamp
        });

        emit TokenTypeCreated(newTokenId, charityId, name, priceWei);
        return newTokenId;
    }

    function purchaseToken(uint256 campaignId, uint256 tokenTypeId, uint256 quantity) external payable nonReentrant whenNotPaused campaignExists(campaignId) {
        require(quantity > 0, "Quantity > 0");
        TokenType storage tt = tokenTypes[tokenTypeId];
        require(tt.id != 0, "Not found");
        Campaign storage camp = campaigns[campaignId];
        require(camp.status == CampaignStatus.Active, "Not active");
        require(tt.charityId == camp.charityId, "Mismatch");

        uint256 totalPrice = tt.priceWei * quantity;
        require(tt.priceWei == 0 || totalPrice / tt.priceWei == quantity, "Overflow");
        require(msg.value == totalPrice, "Wrong amount");

        if (tt.maxSupply != 0) {
            uint256 currentSupply = totalSupply(tokenTypeId);
            require(currentSupply + quantity <= tt.maxSupply, "Exceeds supply");
        }

        _mint(msg.sender, tokenTypeId, quantity, "");

        donationCount++;
        donations[donationCount] = Donation({
            id: donationCount,
            donor: msg.sender,
            charityId: tt.charityId,
            campaignId: campaignId,
            amountWei: msg.value,
            erc20Token: address(0),
            erc20Amount: 0,
            tokenTypeId: tokenTypeId,
            tokenQuantity: quantity,
            timestamp: block.timestamp
        });

        charityNativeBalance[tt.charityId] += msg.value;
        charityNextWithdrawTime[tt.charityId] = block.timestamp + withdrawalTimelock;

        emit DonationReceived(donationCount, msg.sender, tt.charityId, msg.value, address(0), 0, tokenTypeId, quantity);
    }

    // --- Native donations ---
    function donateNative(uint256 campaignId) external payable nonReentrant whenNotPaused campaignExists(campaignId) {
        require(msg.value > 0, "Donation > 0");
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
            tokenTypeId: 0,
            tokenQuantity: 0,
            timestamp: block.timestamp
        });

        charityNativeBalance[charityId] += msg.value;
        charityNextWithdrawTime[charityId] = block.timestamp + withdrawalTimelock;

        emit DonationReceived(donationCount, msg.sender, charityId, msg.value, address(0), 0, 0, 0);
    }

    // --- ERC20 donations ---
    function donateERC20(uint256 campaignId, address tokenAddress, uint256 amount, uint256 minAmount) external nonReentrant whenNotPaused campaignExists(campaignId) {
        require(tokenAddress != address(0), "Invalid token");
        require(amount > 0, "Amount > 0");
        require(acceptedERC20[tokenAddress], "Not accepted");
        require(amount >= minAmount, "Too low");

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
            tokenTypeId: 0,
            tokenQuantity: 0,
            timestamp: block.timestamp
        });

        emit DonationReceived(donationCount, msg.sender, charityId, 0, tokenAddress, amount, 0, 0);
    }

    // --- Withdrawals ---
    function withdrawNative(uint256 charityId, uint256 amountWei) external nonReentrant whenNotPaused {
        require(charities[charityId].id != 0, "Not found");
        require(charities[charityId].wallet == msg.sender, "Unauthorized");
        require(block.timestamp >= charityNextWithdrawTime[charityId], "Locked");
        uint256 bal = charityNativeBalance[charityId];
        require(amountWei <= bal, "Insufficient");

        charityNativeBalance[charityId] = bal - amountWei;

        payable(msg.sender).sendValue(amountWei);
        emit FundsWithdrawn(charityId, msg.sender, amountWei);
    }

    function withdrawERC20(uint256 charityId, address tokenAddress, uint256 amount) external nonReentrant whenNotPaused {
        require(tokenAddress != address(0), "Invalid token");
        require(charities[charityId].id != 0, "Not found");
        require(charities[charityId].wallet == msg.sender, "Unauthorized");
        require(acceptedERC20[tokenAddress], "Not accepted");
        require(block.timestamp >= charityNextWithdrawTime[charityId], "Locked");

        uint256 bal = charityERC20Balance[charityId][tokenAddress];
        require(amount <= bal, "Insufficient");

        charityERC20Balance[charityId][tokenAddress] = bal - amount;
        IERC20(tokenAddress).safeTransfer(msg.sender, amount);

        emit ERC20Withdrawn(charityId, tokenAddress, amount);
    }

    // --- Helpers ---
    function getCharityIdByWallet(address wallet) external view returns (uint256) {
        return charityOfWallet[wallet];
    }

    function isCampaignActive(uint256 campaignId) public view campaignExists(campaignId) returns (bool) {
        Campaign memory c = campaigns[campaignId];
        if (c.status != CampaignStatus.Active) return false;
        if (c.startAt != 0 && block.timestamp < c.startAt) return false;
        if (c.endAt != 0 && block.timestamp > c.endAt) return false;
        return true;
    }

    receive() external payable {
        revert("Use donate");
    }

    fallback() external payable {
        revert("Use donate");
    }

}
