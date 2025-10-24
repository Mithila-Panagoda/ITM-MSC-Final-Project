# Backend - Django REST API

## Overview

This is a Django REST API backend for a blockchain-integrated charity platform. The system enables charity registration, campaign management, donation processing, and fund allocation with full blockchain integration using Sepolia testnet.

## Architecture

### Core Apps

- **`apps/charity/`** - Main charity platform functionality
- **`apps/users/`** - User management and authentication
- **`apps/on_chain/`** - Blockchain integration and token management

### Key Features

- ✅ **Blockchain Integration** - Full Sepolia testnet integration
- ✅ **Charity Management** - Registration and approval system
- ✅ **Campaign Management** - Goal-based fundraising campaigns
- ✅ **Donation Processing** - USD and token donations with blockchain recording
- ✅ **Fund Allocation** - Campaign event creation with blockchain transactions
- ✅ **Admin Controls** - Django admin interface for management
- ✅ **API Documentation** - Swagger/OpenAPI integration

## Models

### Charity App Models

#### `Charity`
- **Purpose**: Represents charitable organizations
- **Key Fields**:
  - `name`, `description`, `website`, `contact_email`
  - `on_chain_id` - Blockchain charity ID
  - `transaction_hash` - Registration transaction hash
- **Blockchain**: Registered on Sepolia testnet via admin wallet

#### `Campaign`
- **Purpose**: Fundraising campaigns for charities
- **Key Fields**:
  - `charity` (ForeignKey), `title`, `description`
  - `goal_amount`, `raised_amount`, `start_date`, `end_date`
  - `on_chain_id` - Blockchain campaign ID
  - `transaction_hash` - Creation transaction hash
- **Status Management**: UPCOMING → ACTIVE → COMPLETED/ENDED

#### `Donation`
- **Purpose**: User donations to campaigns
- **Key Fields**:
  - `user`, `campaign`, `amount` (USD), `token_quantity` (ETH)
  - `transaction_hash` - Blockchain donation transaction
- **Types**: USD donations and token donations

#### `CampaignEvent`
- **Purpose**: Fund allocation events for completed campaigns
- **Key Fields**:
  - `campaign`, `title`, `description`, `amount`
  - `status` - PENDING → COMPLETED/CANCELLED
  - `transaction_hash` - Blockchain allocation transaction
- **Workflow**: Created by charity managers, approved by admin

### On-Chain App Models

#### `Token`
- **Purpose**: ERC20 token management
- **Key Fields**: `name`, `token_id`, `value_fiat_lkr`, `charity`

#### `OnChainTransaction`
- **Purpose**: Token transaction records
- **Key Fields**: `transaction_hash`, `from_address`, `to_address`, `amount`

## API Endpoints

### Charity Endpoints
```
GET    /api/charities/                    # List charities
POST   /api/charities/                    # Create charity (with blockchain registration)
GET    /api/charities/{id}/               # Get charity details
PUT    /api/charities/{id}/               # Update charity
DELETE /api/charities/{id}/               # Delete charity
```

### Campaign Endpoints
```
GET    /api/campaigns/                    # List campaigns
POST   /api/campaigns/                    # Create campaign (with blockchain registration)
GET    /api/campaigns/{id}/               # Get campaign details
PUT    /api/campaigns/{id}/               # Update campaign
DELETE /api/campaigns/{id}/               # Delete campaign
POST   /api/campaigns/{id}/donate/      # Make donation (with blockchain transaction)
POST   /api/campaigns/{id}/allocate_funds/ # Allocate funds to events
GET    /api/campaigns/{id}/utilization/   # Get fund utilization stats
GET    /api/campaigns/all_transactions/   # Get all blockchain transactions
```

### Donation Endpoints
```
GET    /api/donations/                    # List donations
POST   /api/donations/                    # Create donation
GET    /api/donations/{id}/               # Get donation details
```

### Campaign Event Endpoints
```
GET    /api/campaign-events/              # List campaign events
POST   /api/campaign-events/              # Create campaign event
GET    /api/campaign-events/{id}/         # Get event details
PUT    /api/campaign-events/{id}/         # Update event (admin approval)
```

## Blockchain Integration

### Configuration
Environment variables required:
```bash
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0x...  # Deployed contract address
ADMIN_WALLET_ADDRESS=0x...  # Admin wallet public address
ADMIN_WALLET_PRIVATE_KEY=0x...  # Admin wallet private key
```

### Blockchain Service (`apps/on_chain/blockchain_service.py`)

#### Key Functions:
- `register_charity_on_chain()` - Register charity on blockchain
- `create_campaign_on_chain()` - Create campaign on blockchain
- `donate_native_on_chain()` - Process ETH donations
- `donate_erc20_on_chain()` - Process ERC20 token donations
- `create_campaign_event_on_chain()` - Create fund allocation events

#### Transaction Flow:
1. **Charity Registration**: Admin wallet registers charity → Returns `on_chain_id` + `transaction_hash`
2. **Campaign Creation**: Admin wallet creates campaign → Returns `on_chain_id` + `transaction_hash`
3. **Donations**: User makes donation → Admin wallet processes → Returns `transaction_hash`
4. **Fund Allocation**: Admin approves event → Admin wallet allocates → Returns `transaction_hash`

### Smart Contract Integration

- **Contract**: `contract_minimal_v2.sol` (optimized for size)
- **Network**: Sepolia testnet
- **ABI**: `contracts/contract_minimal_abi.json`
- **Explorer**: https://sepolia.etherscan.io

## Authentication & Permissions

### User Roles
- **DONOR** - Can make donations
- **CHARITY_MANAGER** - Can create campaigns and allocate funds
- **ADMIN** - Full system access

### Permission System
- **Charity Management**: Only charity managers can create campaigns
- **Fund Allocation**: Only charity managers can allocate funds
- **Admin Functions**: Only admins can approve campaign events
- **Donations**: Any authenticated user can donate

## Database

### Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Key Migrations:
- `0001_initial.py` - Initial models
- `0002_alter_user_role.py` - User role system
- `0003_campaign_status.py` - Campaign status management
- `0004_campaignevent.py` - Campaign events
- `0005_*` - Blockchain integration fields

## Admin Interface

### Django Admin Features:
- **Charity Management**: View/edit charities with blockchain data
- **Campaign Management**: Monitor campaigns and transactions
- **Donation Tracking**: View all donations with blockchain links
- **Event Approval**: Approve/reject campaign events
- **Transaction Monitoring**: View all blockchain transactions

### Admin URLs:
- `/admin/charity/charity/` - Charity management
- `/admin/charity/campaign/` - Campaign management
- `/admin/charity/donation/` - Donation tracking
- `/admin/charity/campaignevent/` - Event approval

## Signals & Automation

### Django Signals (`apps/charity/signals.py`):
- **Campaign Status Updates**: Automatic status changes based on time/goals
- **Fund Allocation**: Automatic blockchain transactions when events are approved
- **Amount Calculations**: Automatic raised amount updates

### Management Commands:
- `process_existing_events.py` - Process existing completed events for blockchain

## Error Handling

### Blockchain Failures:
- **Database Rollback**: If blockchain transaction fails, database changes are rolled back
- **Graceful Degradation**: System works without blockchain if not configured
- **Error Logging**: Comprehensive logging of blockchain operations

### Validation:
- **Campaign Status**: Events can only be created for completed/ended campaigns
- **Fund Limits**: Total allocated funds cannot exceed raised amount
- **Donation Types**: Either USD amount or token quantity, not both

## Testing

### Manual Testing Checklist:
1. Create charity → Verify blockchain registration
2. Create campaign → Verify blockchain creation
3. Make donation → Verify blockchain transaction
4. Allocate funds → Verify blockchain allocation
5. Check transaction history → Verify all transactions recorded

### API Testing:
```bash
# Test charity creation
curl -X POST http://localhost:8000/api/charities/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Charity", "description": "Test", "contact_email": "test@example.com"}'

# Test donation
curl -X POST http://localhost:8000/api/campaigns/{id}/donate/ \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

## Deployment

### Requirements:
- Python 3.12+
- PostgreSQL (recommended) or SQLite
- Web3.py for blockchain integration
- Django 4.2+

### Environment Setup:
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Production Considerations:
- Set up proper environment variables
- Configure database (PostgreSQL recommended)
- Set up admin wallet with sufficient ETH for gas
- Configure logging for blockchain operations
- Consider using Celery for async blockchain operations

## Security Notes

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use secure environment variable management
- **Admin Wallet**: Ensure admin wallet has sufficient ETH for gas fees
- **Access Control**: Implement proper user role management
- **Transaction Validation**: All blockchain transactions are validated before database updates

## Troubleshooting

### Common Issues:
1. **Blockchain Connection**: Check RPC URL and network connectivity
2. **Gas Fees**: Ensure admin wallet has sufficient ETH
3. **Contract Address**: Verify correct contract address in environment
4. **Migration Issues**: Run migrations if database schema changes
5. **Permission Errors**: Check user roles and permissions

### Debug Commands:
```bash
# Check blockchain configuration
python manage.py shell
>>> from apps.on_chain.blockchain_service import blockchain_service
>>> print(blockchain_service.is_configured)

# Process existing events
python manage.py process_existing_events
```
