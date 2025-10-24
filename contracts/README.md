# Smart Contracts - Sepolia Testnet

## Overview

This directory contains the smart contracts for the blockchain-integrated charity platform. The contracts are deployed on the Sepolia testnet and provide the core blockchain functionality for charity registration, campaign management, donations, and fund allocation.

## Contract Architecture

### Primary Contract: `contract_minimal_v2.sol`

**Purpose**: Streamlined charity platform smart contract optimized for gas efficiency and minimal size.

**Key Features**:
- ✅ **Charity Registration** - Register charitable organizations
- ✅ **Campaign Management** - Create and manage fundraising campaigns  
- ✅ **Donation Processing** - Handle both ETH and ERC20 token donations
- ✅ **Fund Allocation** - Create campaign events for fund distribution
- ✅ **Withdrawal System** - Secure fund withdrawal with timelock
- ✅ **Admin Controls** - Owner-based administration

## Contract Details

### Network Information
- **Network**: Sepolia Testnet
- **Contract Address**: `0x...` (Set in environment variables)
- **Explorer**: https://sepolia.etherscan.io
- **ABI File**: `contract_minimal_abi.json`

### Solidity Version
- **Version**: ^0.8.17
- **OpenZeppelin**: Latest compatible versions
- **Optimization**: Enabled for gas efficiency

## Data Structures

### Charity Structure
```solidity
struct Charity {
    uint256 id;           // Unique charity ID
    address wallet;       // Charity wallet address
    string name;          // Charity name
    string metadataURI;   // Metadata URI
    bool approved;        // Approval status
    uint256 createdAt;    // Creation timestamp
}
```

### Campaign Structure
```solidity
struct Campaign {
    uint256 id;                    // Unique campaign ID
    uint256 charityId;             // Associated charity ID
    uint256 goalAmount;            // Fundraising goal in wei
    uint256 startAt;               // Start timestamp
    uint256 endAt;                 // End timestamp
    uint256 createdAt;             // Creation timestamp
    CampaignStatus status;         // Campaign status
    string title;                  // Campaign title
    string description;            // Campaign description
}
```

### Donation Structure
```solidity
struct Donation {
    uint256 id;                    // Unique donation ID
    address donor;                 // Donor address
    uint256 charityId;            // Associated charity ID
    uint256 campaignId;           // Associated campaign ID
    uint256 amountWei;            // ETH amount in wei
    uint256 erc20Amount;          // ERC20 token amount
    uint256 actualAmountUSD;      // Actual USD amount donated
    uint256 timestamp;            // Donation timestamp
    address erc20Token;           // ERC20 token address (if applicable)
}
```

### Campaign Event Structure
```solidity
struct CampaignEvent {
    uint256 id;                   // Unique event ID
    uint256 campaignId;           // Associated campaign ID
    uint256 charityId;            // Associated charity ID
    uint256 amountUSD;            // Allocated amount in USD
    uint256 timestamp;            // Event timestamp
    string title;                 // Event title
    string description;           // Event description
}
```

## Core Functions

### Charity Management

#### `registerCharity(address wallet, string calldata name, string calldata metadataURI)`
- **Purpose**: Register a new charity on the blockchain
- **Parameters**:
  - `wallet`: Charity wallet address
  - `name`: Charity name
  - `metadataURI`: Metadata URI for charity information
- **Returns**: `uint256` - Charity ID
- **Events**: `CharityRegistered`
- **Access**: Public (anyone can register)

#### Charity Registration Flow:
1. Validate wallet address
2. Increment charity counter
3. Create charity record with auto-approval
4. Emit registration event
5. Return charity ID

### Campaign Management

#### `createCampaign(uint256 charityId, string calldata title, string calldata description, uint256 goalAmountWei, uint256 startAt, uint256 endAt)`
- **Purpose**: Create a new fundraising campaign
- **Parameters**:
  - `charityId`: Associated charity ID
  - `title`: Campaign title
  - `description`: Campaign description
  - `goalAmountWei`: Fundraising goal in wei
  - `startAt`: Start timestamp
  - `endAt`: End timestamp
- **Returns**: `uint256` - Campaign ID
- **Events**: `CampaignCreated`
- **Access**: Public (anyone can create campaigns)

#### Campaign Creation Flow:
1. Validate charity exists and is approved
2. Validate date parameters
3. Increment campaign counter
4. Create campaign with ACTIVE status
5. Emit creation event
6. Return campaign ID

### Donation Processing

#### `donateNative(uint256 campaignId, uint256 actualAmountUSD)`
- **Purpose**: Make ETH donations to campaigns
- **Parameters**:
  - `campaignId`: Target campaign ID
  - `actualAmountUSD`: Actual USD amount donated (in cents)
- **Payable**: Yes (requires ETH)
- **Events**: `DonationReceived`
- **Access**: Public

#### `donateERC20(uint256 campaignId, address tokenAddress, uint256 amount, uint256 minAmount, uint256 actualAmountUSD)`
- **Purpose**: Make ERC20 token donations
- **Parameters**:
  - `campaignId`: Target campaign ID
  - `tokenAddress`: ERC20 token contract address
  - `amount`: Token amount to donate
  - `minAmount`: Minimum expected amount
  - `actualAmountUSD`: Actual USD amount donated (in cents)
- **Events**: `DonationReceived`
- **Access**: Public

#### Donation Processing Flow:
1. Validate campaign exists and is active
2. Validate donation amount (minimum 0.001 ETH for native)
3. Create donation record
4. Update charity balance
5. Set withdrawal timelock
6. Emit donation event

### Fund Allocation

#### `createCampaignEvent(uint256 campaignId, uint256 amountUSD, string memory title, string memory description)`
- **Purpose**: Create fund allocation events
- **Parameters**:
  - `campaignId`: Associated campaign ID
  - `amountUSD`: Allocated amount in USD (cents)
  - `title`: Event title
  - `description`: Event description
- **Events**: `CampaignEventCreated`
- **Access**: Public

#### Event Creation Flow:
1. Validate campaign exists and is active
2. Validate amount and title
3. Increment event counter
4. Create event record
5. Emit event creation event

### Withdrawal System

#### `withdrawNative(uint256 charityId, uint256 amountWei)`
- **Purpose**: Withdraw ETH funds for charity
- **Parameters**:
  - `charityId`: Charity ID
  - `amountWei`: Amount to withdraw in wei
- **Events**: `FundsWithdrawn`
- **Access**: Charity wallet or owner

#### `withdrawERC20(uint256 charityId, address tokenAddress, uint256 amount)`
- **Purpose**: Withdraw ERC20 tokens for charity
- **Parameters**:
  - `charityId`: Charity ID
  - `tokenAddress`: ERC20 token address
  - `amount`: Token amount to withdraw
- **Events**: `ERC20Withdrawn`
- **Access**: Charity wallet or owner

#### Withdrawal Security:
- **Timelock**: 24-hour withdrawal delay
- **Authorization**: Charity wallet or contract owner
- **Balance Validation**: Sufficient balance required
- **Reentrancy Protection**: NonReentrant modifier

## Security Features

### Access Control
- **Owner Functions**: Only contract owner can execute
- **Charity Authorization**: Charity-specific functions require authorization
- **Public Functions**: Donations and registrations are public

### Reentrancy Protection
- **NonReentrant Modifier**: Prevents reentrancy attacks
- **SafeERC20**: Safe token transfers
- **Address Utilities**: Safe address operations

### Withdrawal Security
- **Timelock**: 24-hour delay before withdrawals
- **Balance Tracking**: Separate tracking for ETH and ERC20 tokens
- **Authorization**: Multiple authorization levels

## Events

### Charity Events
```solidity
event CharityRegistered(uint256 indexed charityId, address indexed wallet, string name);
```

### Campaign Events
```solidity
event CampaignCreated(uint256 indexed campaignId, uint256 indexed charityId, string title);
```

### Donation Events
```solidity
event DonationReceived(
    uint256 indexed donationId,
    address indexed donor,
    uint256 charityId,
    uint256 amountWei,
    address erc20Token,
    uint256 erc20Amount,
    uint256 actualAmountUSD
);
```

### Fund Allocation Events
```solidity
event CampaignEventCreated(
    uint256 indexed eventId,
    uint256 indexed campaignId,
    uint256 indexed charityId,
    uint256 amountUSD,
    string title
);
```

### Withdrawal Events
```solidity
event FundsWithdrawn(uint256 indexed charityId, address indexed to, uint256 amountWei);
event ERC20Withdrawn(uint256 indexed charityId, address indexed token, uint256 amount);
```

## Gas Optimization

### Optimizations Applied
- **Struct Packing**: Efficient struct layout
- **Function Optimization**: Minimal gas usage
- **Event Optimization**: Efficient event emission
- **Storage Optimization**: Reduced storage operations

### Gas Estimates
- **Charity Registration**: ~150,000 gas
- **Campaign Creation**: ~120,000 gas
- **Native Donation**: ~100,000 gas
- **ERC20 Donation**: ~150,000 gas
- **Event Creation**: ~80,000 gas

## Deployment

### Deployment Requirements
- **Network**: Sepolia testnet
- **Gas**: Sufficient ETH for deployment
- **Constructor**: No constructor parameters required
- **Verification**: Contract verification on Etherscan

### Deployment Steps
1. **Compile Contract**: Use Solidity compiler
2. **Deploy**: Deploy to Sepolia testnet
3. **Verify**: Verify contract on Etherscan
4. **Configure**: Set contract address in backend
5. **Test**: Test all functions

### Environment Variables
```bash
CONTRACT_ADDRESS=0x...  # Deployed contract address
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/...
ADMIN_WALLET_ADDRESS=0x...  # Admin wallet address
ADMIN_WALLET_PRIVATE_KEY=0x...  # Admin wallet private key
```

## Testing

### Test Scenarios
1. **Charity Registration**: Test charity creation and approval
2. **Campaign Creation**: Test campaign creation and validation
3. **Donation Processing**: Test both ETH and ERC20 donations
4. **Fund Allocation**: Test event creation and tracking
5. **Withdrawal System**: Test withdrawal timelock and authorization
6. **Error Handling**: Test invalid inputs and edge cases

### Test Commands
```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Test functions
npx hardhat test
```

## Integration

### Backend Integration
- **Web3.py**: Python Web3 library for contract interaction
- **ABI Loading**: Load contract ABI from JSON file
- **Function Calls**: Call contract functions from Django views
- **Event Listening**: Listen for contract events

### Frontend Integration
- **Transaction Links**: Direct links to Sepolia Etherscan
- **Status Tracking**: Real-time transaction status
- **Explorer Integration**: Blockchain explorer functionality

## Monitoring

### Contract Monitoring
- **Event Logs**: Monitor all contract events
- **Transaction Status**: Track transaction confirmations
- **Gas Usage**: Monitor gas consumption
- **Error Tracking**: Track failed transactions

### Explorer Integration
- **Sepolia Etherscan**: https://sepolia.etherscan.io
- **Transaction Tracking**: Real-time transaction monitoring
- **Contract Verification**: Verified contract source code
- **Event Logs**: Complete event history

## Maintenance

### Contract Upgrades
- **Immutable Contract**: Current contract is immutable
- **Proxy Pattern**: Consider proxy pattern for future upgrades
- **Migration Strategy**: Plan for contract migration if needed

### Security Audits
- **Code Review**: Regular code review process
- **Security Testing**: Comprehensive security testing
- **Vulnerability Assessment**: Regular vulnerability assessments

## Documentation

### ABI Documentation
- **Function Signatures**: Complete function documentation
- **Event Signatures**: All event documentation
- **Parameter Types**: Detailed parameter documentation

### Integration Guides
- **Backend Integration**: Django integration guide
- **Frontend Integration**: React integration guide
- **API Documentation**: Complete API documentation

## Support

### Troubleshooting
- **Common Issues**: Frequently encountered problems
- **Error Codes**: Error code documentation
- **Debug Tools**: Debugging and monitoring tools

### Community
- **GitHub Issues**: Issue tracking and support
- **Documentation**: Comprehensive documentation
- **Examples**: Code examples and tutorials
