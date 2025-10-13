// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library CharityLibrary {
    function validateCharity(uint256 charityId, mapping(uint256 => Charity) storage charities, address sender) internal view {
        require(charities[charityId].id != 0, "Not found");
        require(charities[charityId].approved, "Not approved");
        require(charities[charityId].wallet == sender, "Unauthorized");
    }

    function validateCampaign(uint256 campaignId, mapping(uint256 => Campaign) storage campaigns) internal view {
        require(campaigns[campaignId].id != 0, "Not found");
    }

    function validateToken(uint256 tokenTypeId, mapping(uint256 => TokenType) storage tokenTypes) internal view {
        require(tokenTypes[tokenTypeId].id != 0, "Not found");
    }

    function validateAmount(uint256 amount) internal pure {
        require(amount > 0, "Amount > 0");
    }

    function validateAddress(address addr) internal pure {
        require(addr != address(0), "Invalid address");
    }
}

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
