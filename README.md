# Blockchain-Integrated Charity Platform

## 🎯 Project Overview

A comprehensive blockchain-integrated charity platform built with Django REST API backend, React TypeScript frontend, and Solidity smart contracts on Sepolia testnet. The platform enables charity registration, campaign management, donation processing, and fund allocation with full blockchain transparency.

## 🎬 Demo Video

Watch the complete application demonstration:

<iframe width="800" height="450" src="https://www.youtube.com/embed/4PGy4zrkySk" title="Blockchain-Integrated Charity Platform Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"></iframe>

### Demo Highlights:
- ✅ **Charity Registration** - On-chain charity creation with blockchain verification
- ✅ **Campaign Management** - Complete campaign lifecycle with real-time updates
- ✅ **Donation Processing** - Multi-currency donations with blockchain recording
- ✅ **Fund Allocation** - Event creation and fund distribution with blockchain transactions
- ✅ **Transaction Tracking** - Complete blockchain transaction history with Sepolia Etherscan links
- ✅ **User Management** - Role-based authentication and permission system
- ✅ **Admin Interface** - Django admin for campaign event approval and system management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   React/TS      │◄──►│   Django API    │◄──►│  Sepolia Net    │
│   Material-UI   │    │   PostgreSQL    │    │  Smart Contract │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Key Features

### ✅ **Blockchain Integration**
- **Sepolia Testnet** - Full blockchain integration
- **Smart Contracts** - Optimized Solidity contracts
- **Transaction Tracking** - Complete transaction history
- **Explorer Integration** - Direct links to Etherscan

### ✅ **Charity Management**
- **Registration** - On-chain charity registration
- **Approval System** - Admin approval workflow
- **Profile Management** - Complete charity profiles
- **Blockchain Status** - Real-time blockchain status

### ✅ **Campaign System**
- **Campaign Creation** - Goal-based fundraising
- **Status Management** - UPCOMING → ACTIVE → COMPLETED/ENDED
- **Progress Tracking** - Real-time progress updates
- **Fund Utilization** - Track fund allocation

### ✅ **Donation Processing**
- **Multi-Currency** - USD and ETH donations
- **Blockchain Recording** - All donations on-chain
- **Transaction History** - Complete donation tracking
- **Real-time Updates** - Live donation monitoring

### ✅ **Fund Allocation**
- **Event Creation** - Campaign event management
- **Admin Approval** - Workflow-based approval
- **Blockchain Recording** - All allocations on-chain
- **Event Tracking** - Complete event history

### ✅ **User Management**
- **Role-Based Access** - Donor, Charity Manager, Admin
- **Authentication** - Email/password and wallet login
- **Permission System** - Granular access control
- **Security** - JWT-based authentication

## 🛠️ Tech Stack

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Primary database
- **Web3.py** - Blockchain integration
- **Celery** - Async task processing

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Material-UI** - Professional UI components
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing

### Blockchain
- **Solidity ^0.8.17** - Smart contract language
- **OpenZeppelin** - Security libraries
- **Sepolia Testnet** - Ethereum test network
- **Web3.py** - Python blockchain integration

## 📁 Project Structure

```
ITM-MSC-Final-Project/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── charity/        # Charity platform core
│   │   ├── users/          # User management
│   │   └── on_chain/       # Blockchain integration
│   ├── project/           # Django settings
│   └── requirements.txt   # Python dependencies
├── frontend/              # React TypeScript app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json       # Node dependencies
├── contracts/             # Smart contracts
│   ├── contract_minimal_v2.sol  # Main contract
│   └── contract_minimal_abi.json # Contract ABI
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL 13+**
- **Git**

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Blockchain Setup
1. **Deploy Contract** to Sepolia testnet
2. **Configure Environment** variables
3. **Fund Admin Wallet** with Sepolia ETH
4. **Test Integration** with deployed contract

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/charity_platform

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0x...
ADMIN_WALLET_ADDRESS=0x...
ADMIN_WALLET_PRIVATE_KEY=0x...

# Security
SECRET_KEY=your-secret-key
DEBUG=False
```

#### Frontend Configuration
```bash
# API
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_BLOCKCHAIN_EXPLORER=https://sepolia.etherscan.io
```

## 📊 Database Schema

### Core Models
- **User** - User accounts and authentication
- **Charity** - Charitable organizations
- **Campaign** - Fundraising campaigns
- **Donation** - User donations
- **CampaignEvent** - Fund allocation events

### Blockchain Fields
- **on_chain_id** - Blockchain entity ID
- **transaction_hash** - Blockchain transaction hash
- **explorer_url** - Blockchain explorer URL

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/login/           # User login
POST   /api/auth/logout/          # User logout
POST   /api/auth/refresh/         # Token refresh
POST   /api/auth/wallet-login/    # Wallet authentication
```

### Charities
```
GET    /api/charities/            # List charities
POST   /api/charities/            # Create charity
GET    /api/charities/{id}/       # Get charity details
PUT    /api/charities/{id}/       # Update charity
```

### Campaigns
```
GET    /api/campaigns/            # List campaigns
POST   /api/campaigns/            # Create campaign
GET    /api/campaigns/{id}/       # Get campaign details
POST   /api/campaigns/{id}/donate/ # Make donation
POST   /api/campaigns/{id}/allocate_funds/ # Allocate funds
```

### Transactions
```
GET    /api/campaigns/all_transactions/ # Get all blockchain transactions
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **Role-Based Access** - Granular permission system
- **Wallet Integration** - Web3 wallet authentication
- **Session Management** - Secure session handling

### Blockchain Security
- **Transaction Validation** - All transactions validated
- **Gas Optimization** - Efficient gas usage
- **Reentrancy Protection** - Secure contract functions
- **Access Control** - Multi-level authorization

### Data Security
- **Input Validation** - Client and server-side validation
- **SQL Injection Protection** - Django ORM protection
- **XSS Protection** - Sanitized user input
- **CSRF Protection** - Cross-site request forgery protection

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
python manage.py test apps.charity
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

### Blockchain Testing
```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Test contract functions
npx hardhat test
```

## 📈 Performance

### Backend Optimization
- **Database Indexing** - Optimized database queries
- **Caching** - Redis caching for frequently accessed data
- **Async Processing** - Celery for blockchain operations
- **API Optimization** - Efficient API responses

### Frontend Optimization
- **Code Splitting** - Lazy loading of components
- **Memoization** - React.memo for expensive components
- **Query Caching** - TanStack Query caching
- **Bundle Optimization** - Webpack optimization

### Blockchain Optimization
- **Gas Efficiency** - Optimized contract functions
- **Batch Operations** - Efficient batch processing
- **Event Filtering** - Optimized event listening
- **Transaction Batching** - Reduced transaction costs

## 🚀 Deployment

### Production Deployment
1. **Backend Deployment**
   - Configure production database
   - Set up environment variables
   - Deploy to cloud platform
   - Configure SSL certificates

2. **Frontend Deployment**
   - Build production bundle
   - Deploy to CDN
   - Configure API endpoints
   - Set up monitoring

3. **Blockchain Deployment**
   - Deploy contract to mainnet
   - Verify contract on Etherscan
   - Configure production RPC
   - Set up monitoring

### Environment Setup
```bash
# Production environment
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://...
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/...
```

## 📊 Monitoring

### Application Monitoring
- **Error Tracking** - Comprehensive error logging
- **Performance Monitoring** - Response time tracking
- **User Analytics** - User behavior tracking
- **API Monitoring** - API performance metrics

### Blockchain Monitoring
- **Transaction Tracking** - Real-time transaction monitoring
- **Gas Usage** - Gas consumption tracking
- **Event Logs** - Contract event monitoring
- **Explorer Integration** - Blockchain explorer links

## 🔧 Maintenance

### Regular Maintenance
- **Database Cleanup** - Regular data cleanup
- **Log Rotation** - Log file management
- **Security Updates** - Regular security patches
- **Performance Optimization** - Continuous optimization

### Blockchain Maintenance
- **Contract Monitoring** - Contract health monitoring
- **Gas Optimization** - Regular gas usage optimization
- **Security Audits** - Regular security assessments
- **Upgrade Planning** - Future upgrade planning

## 📚 Documentation

### API Documentation
- **Swagger/OpenAPI** - Interactive API documentation
- **Endpoint Documentation** - Complete endpoint reference
- **Authentication Guide** - Authentication documentation
- **Error Codes** - Error code reference

### User Documentation
- **User Guide** - Complete user manual
- **Admin Guide** - Administrator documentation
- **Developer Guide** - Developer documentation
- **API Reference** - Complete API reference

## 🤝 Contributing

### Development Workflow
1. **Fork Repository** - Create feature branch
2. **Develop Feature** - Implement new features
3. **Test Thoroughly** - Comprehensive testing
4. **Submit PR** - Pull request submission
5. **Code Review** - Peer review process

### Code Standards
- **Python** - PEP 8 compliance
- **TypeScript** - ESLint configuration
- **Solidity** - Solidity style guide
- **Documentation** - Comprehensive documentation

## 📞 Support

### Getting Help
- **Documentation** - Comprehensive documentation
- **GitHub Issues** - Issue tracking
- **Community** - Developer community
- **Support Team** - Direct support

### Troubleshooting
- **Common Issues** - Frequently asked questions
- **Debug Guides** - Debugging documentation
- **Error Solutions** - Error resolution guides
- **Performance Tips** - Optimization guides

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** - Security libraries
- **Material-UI** - UI component library
- **Django** - Web framework
- **React** - Frontend library
- **Ethereum** - Blockchain platform

---

**Built with ❤️ for transparent charity management**