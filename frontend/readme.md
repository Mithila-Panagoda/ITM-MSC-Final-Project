# CharityChain Frontend

A modern React frontend for the CharityChain blockchain-based charity fundraising platform.

## Features

- **Modern UI/UX**: Built with Material-UI (MUI) for a professional, responsive design
- **Authentication**: JWT-based authentication with protected routes
- **Campaign Management**: View, create, and manage fundraising campaigns
- **Charity Management**: Browse and manage charitable organizations
- **Token Support**: View and manage blockchain tokens
- **Transaction Tracking**: Monitor on-chain transactions
- **Real-time Data**: React Query for efficient data fetching and caching
- **Type Safety**: Full TypeScript support

## Tech Stack

- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **React Query** for state management and API calls
- **React Hook Form** with Yup validation
- **Axios** for HTTP requests

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on http://127.0.0.1:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Campaigns/      # Campaign-related components
│   ├── Charities/      # Charity management components
│   ├── Layout/         # Layout and navigation components
│   ├── Tokens/         # Token management components
│   └── Transactions/   # Transaction components
├── contexts/           # React contexts (Auth, etc.)
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## API Integration

The frontend integrates with the Django REST API backend. All API calls are centralized in the `services/api.ts` file using Axios with:

- Automatic JWT token management
- Request/response interceptors
- Error handling
- Type-safe API calls

## Authentication

- Email-based authentication (username is email)
- JWT tokens with automatic refresh
- Protected routes for authenticated users
- Role-based access control

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api/api
```

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Add proper error handling
4. Include loading states for async operations
5. Test thoroughly before submitting

## License

This project is part of the ITM MSc Final Project.