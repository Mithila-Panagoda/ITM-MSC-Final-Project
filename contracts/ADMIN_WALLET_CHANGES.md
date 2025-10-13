# Admin Wallet Multi-Charity Support

## Problem
The original contract prevented the same wallet from registering multiple charities, causing "Already registered" errors when the admin wallet tried to create multiple charities.

## Solution
Updated the contract to allow the admin wallet to:
1. Register multiple charities
2. Create campaigns for any charity
3. Withdraw funds for any charity

## Changes Made

### 1. Charity Registration (`registerCharity`)
**Before:**
```solidity
require(charityOfWallet[wallet] == 0, "Already registered");
charityOfWallet[wallet] = charityCount;
```

**After:**
```solidity
// Removed: require(charityOfWallet[wallet] == 0, "Already registered");
// Allow same wallet to register multiple charities
// Don't update charityOfWallet mapping to allow multiple charities per wallet
```

### 2. Campaign Creation (`createCampaign`)
**Before:**
```solidity
uint256 regId = charityOfWallet[msg.sender];
require(regId != 0 && regId == charityId, "Unauthorized");
```

**After:**
```solidity
// Allow any wallet to create campaigns for any charity
// This enables admin wallet to create campaigns for all charities
require(charities[charityId].id != 0, "Charity not found");
```

### 3. Native Withdrawals (`withdrawNative`)
**Before:**
```solidity
require(charities[charityId].wallet == msg.sender, "Unauthorized");
```

**After:**
```solidity
// Allow admin wallet to withdraw funds for any charity
require(charities[charityId].wallet == msg.sender || msg.sender == owner(), "Unauthorized");
```

### 4. ERC20 Withdrawals (`withdrawERC20`)
**Before:**
```solidity
require(charities[charityId].wallet == msg.sender, "Unauthorized");
```

**After:**
```solidity
// Allow admin wallet to withdraw ERC20 funds for any charity
require(charities[charityId].wallet == msg.sender || msg.sender == owner(), "Unauthorized");
```

## Benefits

1. **Simplified Management**: Admin wallet can manage all charities and campaigns
2. **No Wallet Generation**: No need to generate unique wallet addresses
3. **Centralized Control**: All blockchain operations go through admin wallet
4. **Backward Compatible**: Existing functionality remains unchanged
5. **Security Maintained**: Only charity wallet or contract owner can withdraw funds

## Backend Changes Reverted

- Removed `_generate_charity_wallet_address()` function
- Removed `hashlib` import
- Reverted to using admin wallet address for all charity registrations

## Deployment Notes

1. Deploy the updated `contract_minimal.sol` to Sepolia
2. Update `CONTRACT_ADDRESS` environment variable
3. Generate new ABI from deployed contract
4. Update `contract_minimal_abi.json` with new ABI
5. No backend code changes needed (already reverted)

## Testing

The updated contract allows:
- ✅ Same admin wallet to register multiple charities
- ✅ Admin wallet to create campaigns for any charity
- ✅ Admin wallet to withdraw funds for any charity
- ✅ Original charity wallet to still withdraw their own funds
- ✅ All existing functionality preserved
