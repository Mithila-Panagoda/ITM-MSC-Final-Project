# Frontend - React TypeScript Application

## Overview

This is a modern React TypeScript frontend for a blockchain-integrated charity platform. Built with Material-UI (MUI) for a professional UI/UX and TanStack Query for efficient data management.

## Architecture

### Tech Stack
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - Professional component library
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication

### Project Structure
```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Campaigns/       # Campaign management
│   ├── Charities/       # Charity management
│   ├── Dashboard/       # Dashboard components
│   ├── Layout/          # Layout components
│   ├── Transactions/    # Transaction display
│   └── Tokens/          # Token management
├── contexts/            # React contexts
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── config/             # Configuration files
```

## Key Features

### ✅ Authentication System
- **Login/Logout** - Email/password authentication
- **Wallet Login** - Web3 wallet integration (MetaMask)
- **Role-Based Access** - Donor, Charity Manager, Admin roles
- **Protected Routes** - Route protection based on authentication

### ✅ Charity Management
- **Charity Listing** - View all charities with blockchain status
- **Charity Creation** - Create new charities (Charity Managers)
- **Blockchain Integration** - View blockchain transaction links
- **Search & Filter** - Advanced filtering capabilities

### ✅ Campaign Management
- **Campaign Listing** - View all campaigns with status
- **Campaign Creation** - Create fundraising campaigns
- **Campaign Details** - Detailed campaign view with donations
- **Status Management** - Real-time status updates
- **Fund Utilization** - Track how funds are allocated

### ✅ Donation System
- **Make Donations** - USD and token donations
- **Donation History** - View all donations
- **Blockchain Integration** - View donation transactions on Sepolia
- **Real-time Updates** - Live donation tracking

### ✅ Fund Allocation
- **Event Creation** - Create campaign events for fund allocation
- **Event Management** - Approve/reject events (Admin)
- **Blockchain Recording** - All allocations recorded on blockchain
- **Event Tracking** - Monitor event status and transactions

### ✅ Transaction Management
- **Unified Transaction View** - All blockchain transactions in one place
- **Transaction Types** - Donations, Campaign Events, Charity Registrations
- **Blockchain Explorer** - Direct links to Sepolia Etherscan
- **Search & Filter** - Advanced transaction filtering

## Components

### Authentication Components (`components/Auth/`)

#### `LoginForm.tsx`
- Email/password login form
- Form validation and error handling
- Redirect to dashboard on success

#### `WalletLogin.tsx`
- Web3 wallet connection (MetaMask)
- Wallet address display
- Blockchain authentication

#### `ProtectedRoute.tsx`
- Route protection wrapper
- Authentication checking
- Redirect to login if not authenticated

#### `RoleBasedRoute.tsx`
- Role-based access control
- Permission checking
- Role-specific redirects

### Campaign Components (`components/Campaigns/`)

#### `CampaignList.tsx`
- Campaign grid/list display
- Status indicators and progress bars
- Blockchain transaction links
- Search and filtering

#### `CampaignDetail.tsx`
- Detailed campaign view
- Donation form integration
- Recent donations display
- Fund utilization tracking
- Blockchain explorer links

#### `AddCampaign.tsx`
- Campaign creation form
- Goal amount and date selection
- Charity selection
- Form validation

#### `CampaignEventsList.tsx`
- Campaign event display
- Event status indicators
- Blockchain transaction links
- Event management actions

#### `CreateEventDialog.tsx`
- Event creation modal
- Amount and description input
- Form validation

### Charity Components (`components/Charities/`)

#### `CharityList.tsx`
- Charity grid display
- Blockchain status indicators
- Search and filtering
- Action buttons

#### `AddCharity.tsx`
- Charity creation form
- Contact information input
- Form validation
- Blockchain integration

### Transaction Components (`components/Transactions/`)

#### `TransactionList.tsx`
- Unified transaction display
- Transaction type indicators
- Blockchain explorer links
- Advanced filtering
- Statistics dashboard

### Dashboard Components (`components/Dashboard/`)

#### `Dashboard.tsx`
- Main dashboard view
- Statistics overview
- Recent activity
- Quick actions

### Layout Components (`components/Layout/`)

#### `Layout.tsx`
- Main application layout
- Navigation sidebar
- Header with user info
- Responsive design

#### `Header.tsx`
- Top navigation bar
- User menu
- Authentication status
- Role indicators

## Services

### API Service (`services/api.ts`)

#### Authentication
```typescript
login(credentials: LoginRequest): Promise<LoginResponse>
logout(): Promise<void>
refreshToken(): Promise<LoginResponse>
```

#### Charities
```typescript
getCharities(): Promise<PaginatedResponse<Charity>>
getCharity(id: string): Promise<Charity>
createCharity(data: CharityCreate): Promise<Charity>
updateCharity(id: string, data: CharityUpdate): Promise<Charity>
```

#### Campaigns
```typescript
getCampaigns(): Promise<PaginatedResponse<Campaign>>
getCampaign(id: string): Promise<Campaign>
createCampaign(data: CampaignCreate): Promise<Campaign>
donate(campaignId: string, data: DonationCreate): Promise<Donation>
allocateFunds(campaignId: string, data: CampaignEventCreate): Promise<CampaignEvent>
getAllTransactions(params?: TransactionParams): Promise<PaginatedResponse<UnifiedTransaction>>
```

#### Donations
```typescript
getDonations(): Promise<PaginatedResponse<Donation>>
getDonation(id: string): Promise<Donation>
```

#### Campaign Events
```typescript
getCampaignEvents(): Promise<PaginatedResponse<CampaignEvent>>
getCampaignEvent(id: string): Promise<CampaignEvent>
createCampaignEvent(data: CampaignEventCreate): Promise<CampaignEvent>
```

## Types

### Core Types (`types/index.ts`)

#### User Types
```typescript
interface User {
  id: string;
  email: string;
  role: 'DONOR' | 'CHARITY_MANAGER' | 'ADMIN';
  wallet_address?: string;
  auth_type: 'EMAIL' | 'WALLET';
}
```

#### Charity Types
```typescript
interface Charity {
  id: string;
  name: string;
  description: string;
  website?: string;
  contact_email: string;
  on_chain_id?: number;
  transaction_hash?: string;
  charity_explorer_url?: string;
}
```

#### Campaign Types
```typescript
interface Campaign {
  id: string;
  charity: string;
  title: string;
  description: string;
  goal_amount: number;
  raised_amount: number;
  start_date: string;
  end_date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ENDED';
  on_chain_id?: number;
  transaction_hash?: string;
  campaign_explorer_url?: string;
}
```

#### Transaction Types
```typescript
interface UnifiedTransaction {
  id: string;
  type: 'donation' | 'campaign_event' | 'charity_registration' | 'campaign_creation' | 'on_chain';
  transaction_hash: string;
  amount: number;
  token_quantity: number;
  from_address: string;
  to_address: string;
  charity_name: string;
  campaign_title: string;
  user_email: string;
  timestamp: string;
  status: string;
  explorer_url?: string;
}
```

## Utilities

### Blockchain Utilities (`utils/blockchain.ts`)

#### Transaction URL Generation
```typescript
export const getTransactionUrl = (txHash: string): string =>
  `https://sepolia.etherscan.io/tx/${txHash}`;

export const getAddressUrl = (address: string): string =>
  `https://sepolia.etherscan.io/address/${address}`;
```

#### Address Formatting
```typescript
export const truncateAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;
```

## State Management

### Authentication Context (`contexts/AuthContext.tsx`)
- User authentication state
- Login/logout functions
- Token management
- Role-based access

### TanStack Query Integration
- Automatic data fetching
- Caching and synchronization
- Background updates
- Error handling
- Loading states

## UI/UX Features

### Material-UI Integration
- **Theme System** - Consistent design language
- **Responsive Design** - Mobile-first approach
- **Component Library** - Pre-built components
- **Accessibility** - WCAG compliance

### User Experience
- **Real-time Updates** - Live data synchronization
- **Loading States** - Skeleton loaders and spinners
- **Error Handling** - User-friendly error messages
- **Form Validation** - Real-time validation feedback
- **Navigation** - Intuitive routing and navigation

## Blockchain Integration

### Sepolia Testnet Integration
- **Transaction Links** - Direct links to Sepolia Etherscan
- **Transaction Status** - Real-time transaction status
- **Blockchain Explorer** - Integrated explorer functionality
- **Transaction History** - Complete transaction tracking

### Web3 Integration
- **Wallet Connection** - MetaMask integration
- **Address Display** - Formatted wallet addresses
- **Transaction Signing** - Web3 transaction handling

## Development

### Getting Started
```bash
npm install
npm start
```

### Available Scripts
```bash
npm start          # Start development server
npm build          # Build for production
npm test           # Run tests
npm run lint       # Run ESLint
```

### Environment Configuration
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_BLOCKCHAIN_EXPLORER=https://sepolia.etherscan.io
```

## Build & Deployment

### Production Build
```bash
npm run build
```

### Deployment Considerations
- **Environment Variables** - Configure API endpoints
- **HTTPS** - Secure connections required
- **CORS** - Backend CORS configuration
- **Static Files** - Serve build files from web server

## Testing

### Component Testing
- **Unit Tests** - Individual component testing
- **Integration Tests** - Component interaction testing
- **User Testing** - Manual user flow testing

### API Testing
- **Mock Data** - Test with mock API responses
- **Error Scenarios** - Test error handling
- **Loading States** - Test loading scenarios

## Performance

### Optimization Features
- **Code Splitting** - Lazy loading of components
- **Memoization** - React.memo for expensive components
- **Query Caching** - TanStack Query caching
- **Bundle Optimization** - Webpack optimization

### Best Practices
- **TypeScript** - Type safety throughout
- **Component Reusability** - Reusable component patterns
- **State Management** - Efficient state updates
- **Error Boundaries** - Graceful error handling

## Security

### Authentication Security
- **Token Management** - Secure token storage
- **Role Validation** - Server-side role verification
- **Route Protection** - Client and server-side protection

### Data Security
- **Input Validation** - Client and server-side validation
- **XSS Protection** - Sanitized user input
- **CSRF Protection** - Cross-site request forgery protection

## Troubleshooting

### Common Issues
1. **API Connection** - Check backend server status
2. **Authentication** - Verify token validity
3. **Blockchain Links** - Check transaction hash format
4. **Build Errors** - Check TypeScript compilation
5. **CORS Issues** - Verify backend CORS configuration

### Debug Tools
- **React DevTools** - Component inspection
- **TanStack Query DevTools** - Query debugging
- **Browser DevTools** - Network and console debugging
- **TypeScript Compiler** - Type checking

## Contributing

### Code Standards
- **TypeScript** - Strict type checking
- **ESLint** - Code linting and formatting
- **Component Structure** - Consistent component patterns
- **API Integration** - Proper error handling

### Development Workflow
1. **Feature Development** - Create feature branches
2. **Testing** - Test thoroughly before merging
3. **Code Review** - Peer review process
4. **Documentation** - Update documentation as needed