import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, WalletLoginRequest, UserRole } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  walletLogin: (data: WalletLoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isCharityManager: boolean;
  justLoggedOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          apiService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      await apiService.login(credentials);
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const walletLogin = async (data: WalletLoginRequest) => {
    try {
      await apiService.walletLogin(data);
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setJustLoggedOut(true);
    // Reset the logout flag after a short delay
    setTimeout(() => setJustLoggedOut(false), 1000);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const isCharityManager = user?.role === UserRole.CHARITY_MANAGER;

  const value: AuthContextType = {
    user,
    login,
    walletLogin,
    logout,
    loading,
    isAuthenticated,
    hasRole,
    isCharityManager,
    justLoggedOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
