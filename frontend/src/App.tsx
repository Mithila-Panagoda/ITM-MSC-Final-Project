import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleBasedRoute from './components/Auth/RoleBasedRoute';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import CampaignsPage from './components/Campaigns/CampaignList';
import CampaignDetail from './components/Campaigns/CampaignDetail';
import AddCampaign from './components/Campaigns/AddCampaign';
import CharitiesPage from './components/Charities/CharityList';
import AddCharity from './components/Charities/AddCharity';
import TokensPage from './components/Tokens/TokenList';
import TransactionsPage from './components/Transactions/TransactionList';
import { UserRole } from './types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, isCharityManager } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm />
          )
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Dashboard - Not accessible to CHARITY_MANAGER */}
                <Route 
                  path="/" 
                  element={
                    isCharityManager ? (
                      <Navigate to="/campaigns" replace />
                    ) : (
                      <Dashboard />
                    )
                  } 
                />
                
                {/* Campaigns - Accessible to all */}
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                
                {/* Add Campaign - Only CHARITY_MANAGER and admins */}
                <Route 
                  path="/campaigns/new" 
                  element={
                    <RoleBasedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHARITY_MANAGER]}>
                      <AddCampaign />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Charities - Accessible to all */}
                <Route path="/charities" element={<CharitiesPage />} />
                
                {/* Add Charity - Only CHARITY_MANAGER and admins */}
                <Route 
                  path="/charities/new" 
                  element={
                    <RoleBasedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHARITY_MANAGER]}>
                      <AddCharity />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Tokens - Not accessible to CHARITY_MANAGER */}
                <Route 
                  path="/tokens" 
                  element={
                    <RoleBasedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CUSTOMER]}>
                      <TokensPage />
                    </RoleBasedRoute>
                  } 
                />
                
                {/* Transactions - Not accessible to CHARITY_MANAGER */}
                <Route 
                  path="/transactions" 
                  element={
                    <RoleBasedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CUSTOMER]}>
                      <TransactionsPage />
                    </RoleBasedRoute>
                  } 
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;