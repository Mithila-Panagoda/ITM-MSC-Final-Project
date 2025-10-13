# Environment Variables Configuration

This document describes the environment variables required for the blockchain-integrated charity platform.

## Required Environment Variables

### Database Configuration
```bash
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PWD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

### Django Configuration
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Email Configuration
```bash
DJANGO_EMAIL_HOST=smtp.gmail.com
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_USE_TLS=True
DJANGO_EMAIL_HOST_USER=your-email@gmail.com
DJANGO_EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend URL
```bash
WEBAPP_URL=http://localhost:3000
```

## Blockchain Configuration (Required for blockchain integration)

### Contract Information
- **Contract Type**: Minimal Charity Contract (optimized for size)
- **Network**: Sepolia Testnet
- **ABI File**: `contracts/contract_minimal_abi.json`
- **Explorer**: https://sepolia.etherscan.io

### Sepolia Testnet Configuration
```bash
# Sepolia testnet RPC URL (get from providers like Infura, Alchemy, etc.)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployed smart contract address on Sepolia testnet
# Example: https://sepolia.etherscan.io/tx/0xbb7af7a7934e1a4dfa7a608af92229be253237d139379a8e50a1e960002c6d7f
CONTRACT_ADDRESS=<CONTRACT_ADDRESS>

# Admin wallet configuration
# Public address of the admin wallet (used for all blockchain transactions)
ADMIN_WALLET_ADDRESS=0x1234567890123456789012345678901234567890

# Private key of the admin wallet (NEVER commit this to version control)
# This should be stored securely and only used in production with proper key management
ADMIN_WALLET_PRIVATE_KEY=<ADMIN_WALLET_PRIVATE_KEY>
```

### JWT Configuration
```bash
SIMPLE_JWT_ACCESS_TOKEN_LIFETIME=5
SIMPLE_JWT_REFRESH_TOKEN_LIFETIME=30
```

### Swagger Configuration
```bash
IS_SWAGGER_ENABLED=true
SWAGGER_ADMIN_LOGIN_ENABLED=false
```

## How to Get Blockchain Configuration Values

### 1. Get Sepolia RPC URL
- Sign up for a free account at [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/)
- Create a new project
- Select "Ethereum" network
- Copy the Sepolia testnet RPC URL
- Replace `YOUR_PROJECT_ID` with your actual project ID

### 2. Deploy Smart Contract
- Use Remix IDE or your preferred development environment
- Deploy the contract to Sepolia testnet
- Copy the deployed contract address

### 3. Set Up Admin Wallet
- Create a new wallet or use an existing one
- **Important**: This wallet will be used for ALL blockchain transactions
- Fund the wallet with Sepolia ETH for gas fees
- Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### 4. Security Considerations
- **NEVER** commit private keys to version control
- Use environment variables or secure key management systems
- Consider using hardware wallets for production
- Rotate keys regularly
- Monitor wallet activity

## Example .env File

Create a `.env` file in the backend directory with the following structure:

```bash
# Database
DATABASE_NAME=charity_platform
DATABASE_USER=postgres
DATABASE_PWD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Django
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email
DJANGO_EMAIL_HOST=smtp.gmail.com
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_USE_TLS=True
DJANGO_EMAIL_HOST_USER=your-email@gmail.com
DJANGO_EMAIL_HOST_PASSWORD=your-app-password

# Frontend
WEBAPP_URL=http://localhost:3000

# Blockchain (Replace with your actual values)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0xYourDeployedContractAddress
ADMIN_WALLET_ADDRESS=0xYourAdminWalletAddress
ADMIN_WALLET_PRIVATE_KEY=0xYourAdminWalletPrivateKey

# JWT
SIMPLE_JWT_ACCESS_TOKEN_LIFETIME=5
SIMPLE_JWT_REFRESH_TOKEN_LIFETIME=30

# Swagger
IS_SWAGGER_ENABLED=true
SWAGGER_ADMIN_LOGIN_ENABLED=false
```

## Testing the Configuration

After setting up the environment variables:

1. Run the Django migrations:
   ```bash
   python manage.py migrate
   ```

2. Test the blockchain connection:
   ```bash
   python manage.py shell
   ```
   ```python
   from apps.on_chain.blockchain_service import blockchain_service
   print(blockchain_service.get_network_info())
   ```

3. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Troubleshooting

### Common Issues

1. **"Failed to connect to blockchain network"**
   - Check your RPC URL
   - Ensure you have internet connection
   - Verify the RPC endpoint is working

2. **"Contract execution failed"**
   - Check contract address
   - Ensure contract is deployed on Sepolia
   - Verify admin wallet has sufficient ETH for gas

3. **"Transaction failed"**
   - Check admin wallet balance
   - Verify private key is correct
   - Ensure gas price is appropriate

4. **"Charity must be registered on blockchain"**
   - This is expected behavior
   - Charities are automatically registered when created
   - Check blockchain service logs for errors

### Getting Help

- Check the Django logs for detailed error messages
- Verify all environment variables are set correctly
- Test blockchain connection using the shell command above
- Ensure admin wallet has sufficient Sepolia ETH for gas fees
