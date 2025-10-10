# Thirdweb Wallet Integration

## Overview
This project now supports two authentication methods:
1. **Donor Login**: Uses Thirdweb wallet connection (Google, email, MetaMask, etc.)
2. **Charity Manager Login**: Uses traditional email/password authentication

## Setup Instructions

### 1. Get Thirdweb Client ID
1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project or use existing one
3. Copy your Client ID

### 2. Configure Environment Variables
Create a `.env` file in the frontend directory:
```bash
REACT_APP_THIRDWEB_CLIENT_ID=your-client-id-here
```

### 3. Update Thirdweb Configuration
Edit `frontend/src/config/thirdweb.ts` and replace `"your-client-id-here"` with your actual Client ID.

## Features

### Wallet Login Flow
1. User selects "Donor" login option
2. Thirdweb ConnectButton appears with multiple wallet options:
   - In-app wallet (Google, email, passkey, phone, Facebook, Apple)
   - MetaMask
   - Coinbase Wallet
   - Binance Wallet
3. After wallet connection, user completes profile form (email, first name, last name)
4. Backend creates/finds user account with wallet address
5. JWT tokens are generated and user is logged in

### Charity Manager Login
- Traditional email/password authentication
- More secure for privileged accounts
- No wallet connection required

## Backend Changes

### New User Fields
- `wallet_address`: Stores connected wallet address (unique)
- `auth_type`: 'EMAIL' or 'WALLET' to track authentication method

### New API Endpoint
- `POST /api/users/wallet-login/`: Handles wallet-based authentication

## Frontend Changes

### New Components
- `WalletLogin.tsx`: Thirdweb ConnectButton with profile completion form
- Updated `LoginForm.tsx`: Toggle between donor and charity manager login

### New Dependencies
- `thirdweb`: v5.0.0 for wallet connection
- TypeScript upgraded to 5.3.3 for React 19 compatibility

## Security Notes
- Wallet addresses are unique identifiers
- No password required for wallet-based accounts
- Email is optional but recommended for notifications
- JWT tokens work the same for both authentication methods
- Charity managers use traditional auth for enhanced security

## Testing
1. Start the backend: `cd backend && python manage.py runserver`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to login page
4. Test both login methods:
   - Donor: Use wallet connection
   - Charity Manager: Use email/password
